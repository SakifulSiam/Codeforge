#pragma once

#include <cstddef>
#include <string>

namespace codeforge
{

    enum class TokenType
    {
        Keyword,
        Identifier,
        Number,
        StringLiteral,
        CharacterLiteral,
        Operator,
        Punctuation,
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
