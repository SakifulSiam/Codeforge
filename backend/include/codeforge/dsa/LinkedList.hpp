#pragma once

#include <iterator>
#include <utility>

namespace codeforge::dsa
{
    template <typename T>
    class LinkedList
    {
        struct Node
        {
            T value;
            Node *next = nullptr;
            template <typename U>
            explicit Node(U &&item) : value(std::forward<U>(item)) {}
        };

    public:
        LinkedList() = default;
        LinkedList(const LinkedList &) = delete;
        LinkedList &operator=(const LinkedList &) = delete;
        LinkedList(LinkedList &&other) noexcept : head_(other.head_), tail_(other.tail_)
        {
            other.head_ = other.tail_ = nullptr;
        }
        LinkedList &operator=(LinkedList &&other) noexcept
        {
            if (this != &other)
            {
                clear();
                head_ = other.head_;
                tail_ = other.tail_;
                other.head_ = other.tail_ = nullptr;
            }
            return *this;
        }
        ~LinkedList() { clear(); }

        void push_back(const T &value) { append(value); }
        void push_back(T &&value) { append(std::move(value)); }
        bool empty() const { return head_ == nullptr; }
        void clear()
        {
            while (head_)
            {
                Node *next = head_->next;
                delete head_;
                head_ = next;
            }
            tail_ = nullptr;
        }

        class const_iterator
        {
        public:
            using iterator_category = std::forward_iterator_tag;
            using value_type = T;
            using difference_type = std::ptrdiff_t;
            using pointer = const T *;
            using reference = const T &;
            explicit const_iterator(const Node *node = nullptr) : node_(node) {}
            reference operator*() const { return node_->value; }
            pointer operator->() const { return &node_->value; }
            const_iterator &operator++() { node_ = node_->next; return *this; }
            const_iterator operator++(int) { auto old = *this; ++*this; return old; }
            bool operator==(const const_iterator &other) const { return node_ == other.node_; }
            bool operator!=(const const_iterator &other) const { return !(*this == other); }
        private:
            const Node *node_;
        };
        const_iterator begin() const { return const_iterator(head_); }
        const_iterator end() const { return const_iterator(); }

    private:
        template <typename U>
        void append(U &&value)
        {
            Node *node = new Node(std::forward<U>(value));
            if (tail_) tail_->next = node;
            else head_ = node;
            tail_ = node;
        }
        Node *head_ = nullptr;
        Node *tail_ = nullptr;
    };
}
