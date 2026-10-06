#include "codeforge/Tokenizer.hpp"

#include <cctype>
#include "codeforge/dsa/BinarySearchTreeSet.hpp"
#include <string>
#include <vector>

namespace codeforge
{

    const dsa::BinarySearchTreeSet<std::string> keywords = {
        "alignas", "alignof", "auto", "bool", "break", "case", "catch",
        "char", "class", "const", "constexpr", "continue", "default",
        "delete", "do", "double", "else", "enum", "explicit", "extern",
        "false", "float", "for", "friend", "if", "inline", "int", "long",
        "namespace", "new", "noexcept", "nullptr", "operator", "private",
        "protected", "public", "register", "return", "short", "signed",
        "sizeof", "static", "struct", "switch", "template", "this", "throw",
        "true", "try", "typedef", "typename", "union", "unsigned", "using",
        "virtual", "void", "volatile", "while"};

    const std::vector<std::string> multiCharacterOperators = {
        "<<=", ">>=", "<=>", "->*", "...", "::", "++", "--", "==", "!=",
        "<=", ">=", "&&", "||", "+=", "-=", "*=", "/=", "%=", "<<", ">>",
        "->", ".*", "&=", "|=", "^=", "##"};

    bool beginsWith(const std::string &source, std::size_t position,
                    const std::string &wanted)
    {
        return source.compare(position, wanted.size(), wanted) == 0;
    }

    dsa::LinkedList<Token> Tokenizer::tokenize(const std::string &sourceCode) const
    {
        dsa::LinkedList<Token> tokens;
        std::size_t position = 0;
        std::size_t line = 1;
        std::size_t column = 1;

        const auto advance = [&](char character, std::size_t &currentPosition,
                                 std::size_t &currentLine,
                                 std::size_t &currentColumn)
        {
            ++currentPosition;
            if (character == '\n')
            {
                ++currentLine;
                currentColumn = 1;
            }
            else
            {
                ++currentColumn;
            }
        };

        while (position < sourceCode.size())
        {
            const char current = sourceCode[position];

            if (std::isspace(static_cast<unsigned char>(current)))
            {
                advance(current, position, line, column);
                continue;
            }

            if (beginsWith(sourceCode, position, "//"))
            {
                while (position < sourceCode.size() && sourceCode[position] != '\n')
                {
                    advance(sourceCode[position], position, line, column);
                }
                continue;
            }

            if (beginsWith(sourceCode, position, "/*"))
            {
                advance(sourceCode[position], position, line, column);
                advance(sourceCode[position], position, line, column);
                while (position < sourceCode.size() &&
                       !beginsWith(sourceCode, position, "*/"))
                {
                    advance(sourceCode[position], position, line, column);
                }
                if (position < sourceCode.size())
                {
                    advance(sourceCode[position], position, line, column);
                    advance(sourceCode[position], position, line, column);
                }
                continue;
            }

            const std::size_t tokenLine = line;
            const std::size_t tokenColumn = column;

            if (std::isalpha(static_cast<unsigned char>(current)) || current == '_')
            {
                std::string text;
                while (position < sourceCode.size())
                {
                    const char character = sourceCode[position];
                    if (!std::isalnum(static_cast<unsigned char>(character)) &&
                        character != '_')
                    {
                        break;
                    }
                    text += character;
                    advance(character, position, line, column);
                }

                const TokenType type = keywords.count(text) > 0
                                           ? TokenType::Keyword
                                           : TokenType::Identifier;
                tokens.push_back({type, text, tokenLine, tokenColumn});
                continue;
            }

            if (std::isdigit(static_cast<unsigned char>(current)))
            {
                std::string text;
                while (position < sourceCode.size())
                {
                    const char character = sourceCode[position];
                    if (!std::isalnum(static_cast<unsigned char>(character)) &&
                        character != '.' && character != '_')
                    {
                        break;
                    }
                    text += character;
                    advance(character, position, line, column);
                }
                tokens.push_back({TokenType::Number, text, tokenLine, tokenColumn});
                continue;
            }

            if (current == '"' || current == '\'')
            {
                const char quote = current;
                std::string text;
                bool escaped = false;
                do
                {
                    const char character = sourceCode[position];
                    text += character;
                    advance(character, position, line, column);

                    if (character == quote && text.size() > 1 && !escaped)
                    {
                        break;
                    }
                    if (character == '\\' && !escaped)
                    {
                        escaped = true;
                    }
                    else
                    {
                        escaped = false;
                    }
                } while (position < sourceCode.size());

                const TokenType type = quote == '"'
                                           ? TokenType::StringLiteral
                                           : TokenType::CharacterLiteral;
                tokens.push_back({type, text, tokenLine, tokenColumn});
                continue;
            }

            bool foundOperator = false;
            for (const std::string &operation : multiCharacterOperators)
            {
                if (beginsWith(sourceCode, position, operation))
                {
                    tokens.push_back(
                        {TokenType::Operator, operation, tokenLine, tokenColumn});
                    for (char character : operation)
                    {
                        advance(character, position, line, column);
                    }
                    foundOperator = true;
                    break;
                }
            }
            if (foundOperator)
            {
                continue;
            }

            const std::string punctuation = "(){}[];,?:";
            const TokenType type = punctuation.find(current) != std::string::npos
                                       ? TokenType::Punctuation
                                       : TokenType::Operator;
            tokens.push_back({type, std::string(1, current), tokenLine, tokenColumn});
            advance(current, position, line, column);
        }

        tokens.push_back({TokenType::EndOfFile, "", line, column});
        return tokens;
    }

} // namespace codeforge
