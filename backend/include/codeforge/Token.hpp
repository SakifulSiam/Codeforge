#pragma once

#include <cstddef>
#include <string>

namespace codeforge
{

    enum class TokenType
    {
        Keyword,
        Identifier,//x
        Number,//3
        StringLiteral,//"hello"
        CharacterLiteral,//'a'
        Operator,//+
        Punctuation,//;
        EndOfFile
    };

    struct Token
    {
        TokenType type;
        std::string text;
        std::size_t line;
        std::size_t column;
    };

} // namespace codeforge
