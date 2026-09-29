#pragma once

#include <cstddef>
#include <vector>

namespace codeforge::dsa
{

    template <typename T, typename Compare>
    void mergeSortRange(std::vector<T> &values, std::vector<T> &buffer,
                        std::size_t begin, std::size_t end, Compare comesBefore)
    {
        if (end - begin <= 1)
            return;
        const std::size_t middle = begin + (end - begin) / 2;
        mergeSortRange(values, buffer, begin, middle, comesBefore);
        mergeSortRange(values, buffer, middle, end, comesBefore);

        std::size_t left = begin;
        std::size_t right = middle;
        std::size_t output = begin;
        while (left < middle && right < end)
        {
            if (comesBefore(values[left], values[right]))
                buffer[output++] = values[left++];
            else
                buffer[output++] = values[right++];
        }
        while (left < middle)
            buffer[output++] = values[left++];
        while (right < end)
            buffer[output++] = values[right++];
        for (std::size_t i = begin; i < end; ++i)
            values[i] = buffer[i];
    }

    template <typename T, typename Compare>
    void mergeSort(std::vector<T> &values, Compare comesBefore)
    {
        if (values.empty())
            return;
        std::vector<T> buffer(values);
        mergeSortRange(values, buffer, 0, values.size(), comesBefore);
    }

} // namespace codeforge::dsa
