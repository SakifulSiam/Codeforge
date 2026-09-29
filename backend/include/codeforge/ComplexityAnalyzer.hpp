#pragma once

#include "codeforge/AnalysisResult.hpp"

#include <string>

namespace codeforge
{

    class ComplexityAnalyzer
    {
    public:
        AnalysisResult analyze(const std::string &sourceCode) const;
    };

} // namespace codeforge
