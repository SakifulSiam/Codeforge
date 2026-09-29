#pragma once

#include <memory>
#include <string>

namespace codeforge
{

    enum class ComplexityKind
    {
        One,
        N,
        LogN,
        Product,
        Unknown
    };

    struct ComplexityNode
    {
        ComplexityKind kind;
        std::unique_ptr<ComplexityNode> left;
        std::unique_ptr<ComplexityNode> right;
    };

    class ComplexityTree
    {
    public:
        static ComplexityTree fromPowers(int linearPower, int logPower, bool unknown);
        std::string toBigO() const;

    private:
        explicit ComplexityTree(std::unique_ptr<ComplexityNode> root);
        static void countKindsDfs(const ComplexityNode *node, int &nCount,
                                  int &logCount, bool &unknown);
        std::unique_ptr<ComplexityNode> root_;
    };

} // namespace codeforge
