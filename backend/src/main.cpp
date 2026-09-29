#include "crow.h"
#include <string>
#include "codeforge/ComplexityAnalyzer.hpp"
using std::string;

int main()
{
    crow::SimpleApp app;

    CROW_ROUTE(app, "/analysis-complexity")
        .methods("POST"_method)
    ([](const crow::request &req) {
        auto x = crow::json::load(req.body);
        if (!x)
            return crow::response(crow::status::BAD_REQUEST); // same as crow::response(400)
        string s_code = x["source_code"].s();
        const codeforge::ComplexityAnalyzer analyzer;
        auto result = analyzer.analyze(s_code);
        crow::json::wvalue jsonr;
        jsonr["timeComplexity"] = result.timeComplexity;
        jsonr["spaceComplexity"] = result.spaceComplexity;
        crow::json::wvalue::list detectedStructures;
        for (auto &&i : result.detectedStructures)
        {
            detectedStructures.emplace_back(i);
        }
        
        jsonr["detectedStructures"] = std::move(detectedStructures);
        return crow::response{jsonr}; 
    });

    app.port(18080).run();
    return 0;
}