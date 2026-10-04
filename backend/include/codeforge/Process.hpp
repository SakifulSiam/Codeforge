#pragma once

#include <string>
#include <vector>

namespace codeforge
{
    struct ProcessResult
    {
        int exitCode;
        bool timedOut;
    };

    class Process
    {
    public:
        static ProcessResult run(const std::vector<std::string> &command,
                                 const std::string &directory,
                                 const std::string &inputFile,
                                 const std::string &outputFile,
                                 int timeoutSeconds);
    };
}
