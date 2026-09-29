#pragma once

#include <string>
#include <vector>

namespace codeforge
{

    struct AnalysisResult
    {
        std::string timeComplexity = "O(1)";
        std::string spaceComplexity = "O(1)";
        std::vector<std::string> detectedStructures;
    };

} // namespace codeforge
