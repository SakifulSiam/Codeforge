#include "codeforge/ComplexityTree.hpp"

#include <utility>

namespace codeforge
{
    namespace
    {

        std::unique_ptr<ComplexityNode> leaf(ComplexityKind kind)
        {
            return std::make_unique<ComplexityNode>(ComplexityNode{kind, nullptr, nullptr});
        }

        std::unique_ptr<ComplexityNode> product(std::unique_ptr<ComplexityNode> left,
                                                std::unique_ptr<ComplexityNode> right)
        {
            return std::make_unique<ComplexityNode>(
                ComplexityNode{ComplexityKind::Product, std::move(left), std::move(right)});
        }

    } // namespace

    ComplexityTree::ComplexityTree(std::unique_ptr<ComplexityNode> root)
        : root_(std::move(root)) {}

    ComplexityTree ComplexityTree::fromPowers(int linearPower, int logPower,
                                              bool unknown)
    {
        if (unknown)
            return ComplexityTree(leaf(ComplexityKind::Unknown));
        std::unique_ptr<ComplexityNode> root;
        const auto append = [&root](ComplexityKind kind)
        {
            if (!root)
                root = leaf(kind);
            else
                root = product(std::move(root), leaf(kind));
        };
        for (int i = 0; i < linearPower; ++i)
            append(ComplexityKind::N);
        for (int i = 0; i < logPower; ++i)
            append(ComplexityKind::LogN);
        if (!root)
            root = leaf(ComplexityKind::One);
        return ComplexityTree(std::move(root));
    }

    void ComplexityTree::countKindsDfs(const ComplexityNode *node, int &nCount,
                                       int &logCount, bool &unknown)
    {
        if (node == nullptr)
            return;
        if (node->kind == ComplexityKind::N)
            ++nCount;
        else if (node->kind == ComplexityKind::LogN)
            ++logCount;
        else if (node->kind == ComplexityKind::Unknown)
            unknown = true;
        countKindsDfs(node->left.get(), nCount, logCount, unknown);
        countKindsDfs(node->right.get(), nCount, logCount, unknown);
    }

    std::string ComplexityTree::toBigO() const
    {
        int nCount = 0;
        int logCount = 0;
        bool unknown = false;
        countKindsDfs(root_.get(), nCount, logCount, unknown);
        if (unknown)
            return "O(?)";
        if (nCount == 0 && logCount == 0)
            return "O(1)";
        std::string text;
        if (nCount > 0)
        {
            text = "n";
            if (nCount > 1)
                text += "^" + std::to_string(nCount);
        }
        if (logCount > 0)
        {
            if (!text.empty())
                text += " ";
            text += "log n";
            if (logCount > 1)
                text += "^" + std::to_string(logCount);
        }
        return "O(" + text + ")";
    }

} // namespace codeforge
