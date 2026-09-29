cmake_minimum_required(VERSION 3.16)
project(codeforge_backend LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Crow REQUIRED)
add_library(codeforge_engine
    src/codeforge/Tokenizer.cpp
    src/codeforge/CallGraph.cpp
    src/codeforge/ComplexityTree.cpp
    src/codeforge/ComplexityAnalyzer.cpp
)
target_include_directories(codeforge_engine PUBLIC include)
add_executable(codeforge_backend src/main.cpp)
target_link_libraries(codeforge_backend PRIVATE codeforge_engine)
target_link_libraries(codeforge_backend PRIVATE Crow::Crow)