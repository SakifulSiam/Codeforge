#pragma once

#include <stdexcept>
#include <utility>

namespace codeforge::dsa
{
    template <typename T>
    class Queue
    {
        struct Node
        {
            T value;
            Node *next = nullptr;
            template <typename U>
            explicit Node(U &&item) : value(std::forward<U>(item)) {}
        };
    public:
        Queue() = default;
        Queue(const Queue &) = delete;
        Queue &operator=(const Queue &) = delete;
        ~Queue() { while (!empty()) pop(); }
        bool empty() const { return head_ == nullptr; }
        template <typename U>
        void push(U &&value)
        {
            Node *node = new Node(std::forward<U>(value));
            if (tail_) tail_->next = node;
            else head_ = node;
            tail_ = node;
        }
        T &front()
        {
            if (empty()) throw std::out_of_range("Queue is empty");
            return head_->value;
        }
        const T &front() const
        {
            if (empty()) throw std::out_of_range("Queue is empty");
            return head_->value;
        }
        void pop()
        {
            if (empty()) throw std::out_of_range("Queue is empty");
            Node *old = head_;
            head_ = head_->next;
            if (!head_) tail_ = nullptr;
            delete old;
        }
    private:
        Node *head_ = nullptr;
        Node *tail_ = nullptr;
    };
}
