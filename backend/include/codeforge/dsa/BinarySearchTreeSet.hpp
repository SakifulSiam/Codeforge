#pragma once

#include <cstddef>
#include <initializer_list>
#include <utility>

namespace codeforge::dsa
{
    template <typename T>
    class BinarySearchTreeSet
    {
        struct Node
        {
            T value;
            Node *left = nullptr;
            Node *right = nullptr;
            explicit Node(const T &item) : value(item) {}
        };
    public:
        BinarySearchTreeSet() = default;
        BinarySearchTreeSet(std::initializer_list<T> items)
        {
            for (const T &item : items) insert(item);
        }
        BinarySearchTreeSet(const BinarySearchTreeSet &) = delete;
        BinarySearchTreeSet &operator=(const BinarySearchTreeSet &) = delete;
        ~BinarySearchTreeSet() { destroy(root_); }
        void insert(const T &value)
        {
            Node **slot = &root_;
            while (*slot)
            {
                if (value < (*slot)->value) slot = &(*slot)->left;
                else if ((*slot)->value < value) slot = &(*slot)->right;
                else return;
            }
            *slot = new Node(value);
        }
        std::size_t count(const T &value) const
        {
            const Node *node = root_;
            while (node)
            {
                if (value < node->value) node = node->left;
                else if (node->value < value) node = node->right;
                else return 1;
            }
            return 0;
        }
    private:
        static void destroy(Node *node)
        {
            if (!node) return;
            destroy(node->left);
            destroy(node->right);
            delete node;
        }
        Node *root_ = nullptr;
    };
}
