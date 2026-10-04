#include "codeforge/CodeRunner.hpp"
#include "codeforge/Process.hpp"
#include <filesystem>
#include <fstream>
#include <iterator>
#include <random>
#include <stdexcept>

namespace codeforge
{
    RunResult CodeRunner::run(const std::string &sourceCode, const std::string &input) const
    {
        namespace fs = std::filesystem;
        fs::path directory;
        std::random_device random;
        do
        {
            directory = fs::temp_directory_path() / ("codeforge_" + std::to_string(random()));
        } while (!fs::create_directory(directory));

        try
        {
            auto sourceFile = directory / "main.cpp";
            auto inputFile = directory / "input.txt";
            auto outputFile = directory / "output.txt";
#ifdef _WIN32
            auto executable = directory / "program.exe";
#else
            auto executable = directory / "program";
#endif
            std::ofstream source(sourceFile, std::ios::binary);
            std::ofstream stdinFile(inputFile, std::ios::binary);
            source << sourceCode;
            stdinFile << input;
            source.close();
            stdinFile.close();
            if (!source || !stdinFile)
                throw std::runtime_error("Cannot write runner files.");

            std::vector<std::string> command;
#ifdef CODEFORGE_MSVC
            command = {CODEFORGE_CXX_COMPILER, "/nologo", "/std:c++17", "/EHsc",
                       sourceFile.string(), "/Fe:" + executable.string()};
#else
            command = {CODEFORGE_CXX_COMPILER, "-std=c++17", sourceFile.string(),
                       "-o", executable.string()};
#endif
            auto result = Process::run(command, directory.string(), inputFile.string(),
                                       outputFile.string(), 30);
            std::string stage = "compile";
            if (result.exitCode == 0 && !result.timedOut)
            {
                stage = "run";
                result = Process::run({executable.string()}, directory.string(),
                                      inputFile.string(), outputFile.string(), 5);
            }

            std::ifstream output(outputFile, std::ios::binary);
            std::string text{std::istreambuf_iterator<char>(output), std::istreambuf_iterator<char>()};
            output.close();
            std::error_code error;
            fs::remove_all(directory, error);
            return {text, stage, result.exitCode, result.timedOut};
        }
        catch (...)
        {
            std::error_code error;
            fs::remove_all(directory, error);
            throw;
        }
    }
}
