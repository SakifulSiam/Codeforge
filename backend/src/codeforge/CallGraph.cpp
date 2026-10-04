#include "codeforge/CallGraph.hpp"
#include <algorithm>
#include "codeforge/dsa/Queue.hpp"

namespace codeforge
{

    int CallGraph::addFunction(const std::string &name)
    {
        const int existing = indexOf(name);
        if (existing >= 0)
            return existing;
        const int index = static_cast<int>(names_.size());
        names_.push_back(name);
        functionIndexes_[name] = index;
        edges_.emplace_back();
        return index;
    }

    void CallGraph::addCall(int from, int to)
    {
        if (from < 0 || to < 0 || from >= static_cast<int>(size()) ||
            to >= static_cast<int>(size()))
            return;
        auto &outgoing = edges_[static_cast<std::size_t>(from)];
        if (std::find(outgoing.begin(), outgoing.end(), to) == outgoing.end())
        {
            outgoing.push_back(to);
        }
    }

    int CallGraph::indexOf(const std::string &name) const
    {
        const auto found = functionIndexes_.find(name);
        return found == functionIndexes_.end() ? -1 : found->second;
    }

    bool CallGraph::cycleDfs(int vertex, std::vector<int> &state) const
    {
        state[static_cast<std::size_t>(vertex)] = 1;
        for (int next : edges_[static_cast<std::size_t>(vertex)])
        {
            if (state[static_cast<std::size_t>(next)] == 1)
                return true;
            if (state[static_cast<std::size_t>(next)] == 0 && cycleDfs(next, state))
                return true;
        }
        state[static_cast<std::size_t>(vertex)] = 2;
        return false;
    }

    bool CallGraph::hasCycleFrom(int start) const
    {
        if (start < 0 || start >= static_cast<int>(size()))
            return false;
        std::vector<int> state(size(), 0);
        return cycleDfs(start, state);
    }

    std::vector<int> CallGraph::reachableByBfs(int start) const
    {
        std::vector<int> order;
        if (start < 0 || start >= static_cast<int>(size()))
            return order;
        std::vector<bool> visited(size(), false);
        dsa::Queue<int> pending;
        pending.push(start);
        visited[static_cast<std::size_t>(start)] = true;
        while (!pending.empty())
        {
            const int current = pending.front();
            pending.pop();
            order.push_back(current);
            for (int next : edges_[static_cast<std::size_t>(current)])
            {
                if (!visited[static_cast<std::size_t>(next)])
                {
                    visited[static_cast<std::size_t>(next)] = true;
                    pending.push(next);
                }
            }
        }
        return order;
    }

    std::vector<int> CallGraph::shortestPath(int start, int target) const
    {
        if (start < 0 || target < 0 || start >= static_cast<int>(size()) ||
            target >= static_cast<int>(size()))
            return {};
        std::vector<int> parent(size(), -1);
        std::vector<bool> visited(size(), false);
        dsa::Queue<int> pending;
        pending.push(start);
        visited[static_cast<std::size_t>(start)] = true;
        while (!pending.empty())
        {
            const int current = pending.front();
            pending.pop();
            if (current == target)
                break;
            for (int next : edges_[static_cast<std::size_t>(current)])
            {
                if (!visited[static_cast<std::size_t>(next)])
                {
                    visited[static_cast<std::size_t>(next)] = true;
                    parent[static_cast<std::size_t>(next)] = current;
                    pending.push(next);
                }
            }
        }
        if (!visited[static_cast<std::size_t>(target)])
            return {};
        std::vector<int> path;
        for (int current = target; current >= 0;
             current = parent[static_cast<std::size_t>(current)])
        {
            path.push_back(current);
            if (current == start)
                break;
        }
        std::reverse(path.begin(), path.end());
        return path;
    }

    const std::string &CallGraph::nameOf(int index) const
    {
        return names_[static_cast<std::size_t>(index)];
    }

    std::size_t CallGraph::size() const { return names_.size(); }

} // namespace codeforge
