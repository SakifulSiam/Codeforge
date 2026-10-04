#pragma once

#include <string>

namespace codeforge
{
    struct RunResult
    {
        std::string output;
        std::string stage;
        int exitCode;
        bool timedOut;
    };

    class CodeRunner
    {
    public:
        RunResult run(const std::string &sourceCode, const std::string &input = "") const;
    };
}
