#pragma once

#include <map>
#include <string>
#include <vector>

namespace codeforge
{

    class CallGraph
    {
    public:
        int addFunction(const std::string &name);
        void addCall(int from, int to);
        int indexOf(const std::string &name) const;

        bool hasCycleFrom(int start) const;
        std::vector<int> reachableByBfs(int start) const;
        std::vector<int> shortestPath(int start, int target) const;
        const std::string &nameOf(int index) const;
        std::size_t size() const;

    private:
        bool cycleDfs(int vertex, std::vector<int> &state) const;

        std::vector<std::string> names_;
        std::map<std::string, int> functionIndexes_;
        std::vector<std::vector<int>> edges_;
    };

} // namespace codeforge
