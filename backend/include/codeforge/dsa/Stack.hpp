#pragma once

#include <stdexcept>
#include <utility>
#include <vector>

namespace codeforge::dsa
{
    template <typename T>
    class Stack
    {
    public:
        bool empty() const { return values_.empty(); }
        void push(const T &value) { values_.push_back(value); }
        void push(T &&value) { values_.push_back(std::move(value)); }
        T &top()
        {
            if (empty()) throw std::out_of_range("Stack is empty");
            return values_.back();
        }
        const T &top() const
        {
            if (empty()) throw std::out_of_range("Stack is empty");
            return values_.back();
        }
        void pop()
        {
            if (empty()) throw std::out_of_range("Stack is empty");
            values_.pop_back();
        }

    private:
        std::vector<T> values_;
    };
}
