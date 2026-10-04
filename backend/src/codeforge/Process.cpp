#include "codeforge/Process.hpp"
#include <stdexcept>

#ifdef _WIN32
#define NOMINMAX
#include <windows.h>
#else
#include <cerrno>
#include <chrono>
#include <fcntl.h>
#include <signal.h>
#include <sys/wait.h>
#include <thread>
#include <unistd.h>
#endif

namespace codeforge
{
    ProcessResult Process::run(const std::vector<std::string> &command,
                               const std::string &directory,
                               const std::string &inputFile,
                               const std::string &outputFile,
                               int timeoutSeconds)
    {
#ifdef _WIN32
        // Quote arguments using Windows rules, including trailing backslashes.
        std::string commandLine;
        for (const auto &arg : command)
        {
            commandLine += "\"";
            int slashes = 0;
            for (char c : arg)
            {
                if (c == '\\')
                    ++slashes;
                else
                {
                    commandLine.append(c == '"' ? slashes * 2 + 1 : slashes, '\\');
                    commandLine += c;
                    slashes = 0;
                }
            }
            commandLine.append(slashes * 2, '\\');
            commandLine += "\" ";
        }

        SECURITY_ATTRIBUTES security{sizeof(SECURITY_ATTRIBUTES), nullptr, TRUE};
        HANDLE input = CreateFileA(inputFile.c_str(), GENERIC_READ,
                                   FILE_SHARE_READ, &security, OPEN_EXISTING, 0, nullptr);
        HANDLE output = CreateFileA(outputFile.c_str(), GENERIC_WRITE,
                                    FILE_SHARE_READ, &security, CREATE_ALWAYS, 0, nullptr);
        if (input == INVALID_HANDLE_VALUE || output == INVALID_HANDLE_VALUE)
        {
            if (input != INVALID_HANDLE_VALUE) CloseHandle(input);
            if (output != INVALID_HANDLE_VALUE) CloseHandle(output);
            throw std::runtime_error("Cannot open process input/output files.");
        }

        STARTUPINFOA startup{};
        startup.cb = sizeof(startup);
        startup.dwFlags = STARTF_USESTDHANDLES;
        startup.hStdInput = input;
        startup.hStdOutput = output;
        startup.hStdError = output;
        PROCESS_INFORMATION process{};
        BOOL started = CreateProcessA(nullptr, commandLine.data(), nullptr, nullptr,
                                      TRUE, CREATE_NO_WINDOW, nullptr,
                                      directory.c_str(), &startup, &process);
        CloseHandle(input);
        CloseHandle(output);
        if (!started)
            throw std::runtime_error("Cannot start process. Check the compiler path/environment.");

        DWORD waited = WaitForSingleObject(process.hProcess, timeoutSeconds * 1000);
        bool timedOut = waited == WAIT_TIMEOUT;
        if (waited != WAIT_OBJECT_0)
        {
            TerminateProcess(process.hProcess, 1);
            WaitForSingleObject(process.hProcess, INFINITE);
        }
        DWORD exitCode = 1;
        GetExitCodeProcess(process.hProcess, &exitCode);
        CloseHandle(process.hThread);
        CloseHandle(process.hProcess);
        return {timedOut ? -1 : static_cast<int>(exitCode), timedOut};
#else
        std::vector<char *> args;
        for (const auto &arg : command)
            args.push_back(const_cast<char *>(arg.c_str()));
        args.push_back(nullptr);

        int input = open(inputFile.c_str(), O_RDONLY);
        int output = open(outputFile.c_str(), O_WRONLY | O_CREAT | O_TRUNC, 0600);
        if (input < 0 || output < 0)
        {
            if (input >= 0) close(input);
            if (output >= 0) close(output);
            throw std::runtime_error("Cannot open process input/output files.");
        }

        pid_t pid = fork();
        if (pid == 0)
        {
            setpgid(0, 0);
            if (chdir(directory.c_str()) < 0 || dup2(input, STDIN_FILENO) < 0 ||
                dup2(output, STDOUT_FILENO) < 0 || dup2(output, STDERR_FILENO) < 0)
                _exit(126);
            close(input);
            close(output);
            execvp(args[0], args.data());
            const char message[] = "Cannot start process. Check the compiler path/environment.\n";
            write(STDERR_FILENO, message, sizeof(message) - 1);
            _exit(127);
        }
        close(input);
        close(output);
        if (pid < 0)
            throw std::runtime_error("Cannot create process.");

        setpgid(pid, pid);
        auto deadline = std::chrono::steady_clock::now() + std::chrono::seconds(timeoutSeconds);
        int status = 0;
        while (true)
        {
            pid_t finished = waitpid(pid, &status, WNOHANG);
            if (finished == pid)
                return {WIFEXITED(status) ? WEXITSTATUS(status) : 128 + WTERMSIG(status), false};
            if (finished < 0 && errno != EINTR)
                throw std::runtime_error("Cannot wait for process.");
            if (std::chrono::steady_clock::now() >= deadline)
            {
                kill(-pid, SIGKILL);
                kill(pid, SIGKILL);
                while (waitpid(pid, &status, 0) < 0 && errno == EINTR) {}
                return {-1, true};
            }
            std::this_thread::sleep_for(std::chrono::milliseconds(10));
        }
#endif
    }
}
