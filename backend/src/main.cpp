#include "crow.h"
#include <string>
#include "codeforge/ComplexityAnalyzer.hpp"
#include "codeforge/CodeRunner.hpp"
using std::string;

int main()
{
    crow::SimpleApp app;

    CROW_ROUTE(app, "/api/analyze-complexity")
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

    CROW_ROUTE(app, "/api/run-code")
        .methods("POST"_method)
    ([](const crow::request &req) {
        auto x = crow::json::load(req.body);
        if (!x)
            return crow::response(crow::status::BAD_REQUEST);
        string s_code = x["source_code"].s();
        string input = x.has("input") ? string(x["input"].s()) : "";
        try
        {
            const codeforge::CodeRunner runner;
            auto result = runner.run(s_code, input);
            crow::json::wvalue jsonr;
            jsonr["output"] = result.output;
            jsonr["stage"] = result.stage;
            jsonr["exitCode"] = result.exitCode;
            jsonr["timedOut"] = result.timedOut;
            return crow::response{jsonr};
        }
        catch (const std::exception &e)
        {
            crow::json::wvalue jsonr;
            jsonr["error"] = e.what();
            return crow::response{500, jsonr};
        }
    });

    app.port(18080).run();
    return 0;
}
