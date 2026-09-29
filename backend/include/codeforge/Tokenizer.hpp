#pragma once

#include "codeforge/Token.hpp"

#include "codeforge/dsa/LinkedList.hpp"
#include <string>

namespace codeforge
{

    class Tokenizer
    {
    public:
        dsa::LinkedList<Token> tokenize(const std::string &sourceCode) const;
    };

} // namespace codeforge
