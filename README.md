# cad-dsl-project

## Overview

This project implements a domain-specific language (DSL) for generating CAD-style models with physics simulations. The DSL allows users to define geometric shapes and their properties, which can then be rendered using Babylon.js and Three.js.

## Features

- **DSL Syntax**: Define models using a simple and intuitive syntax.
- **Rendering**: Integrate with Babylon.js and Three.js for rendering 3D models.
- **Physics Simulation**: Simulate physics interactions for the defined models.

## Project Structure

```text
cad-dsl-project
├── src
│   ├── core
│   ├── engine
│   ├── models
│   └── tests
├── examples
└── README.md
```

## Setup Instructions

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd cad-dsl-project
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Compile the TypeScript files:

   ```bash
   npm run build
   ```

4. Run the example:

   ```bash
   npm start
   ```

## LLM Setup

The planner now calls an OpenAI-compatible LLM endpoint through the local Node server.

- `LLM_ENDPOINT` sets the chat-completions URL. For Gemini, use `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`.
- `LLM_MODEL` sets the model name, such as `gemini-2.5-flash` or another Gemini model your key can access.
- `GEMINI_API_KEY`, `LLM_API_KEY`, or `OPENAI_API_KEY` is used when the endpoint requires auth.
- `LAW_LLM_ENDPOINT`, `LAW_LLM_MODEL`, `LAW_LLM_API_KEY`, and `LAW_LLM_TEMPERATURE` control the legal review pass that checks generated house plans.
- If you do not set the law-review variables, the app falls back to the main planner endpoint and model.

This is the easiest low-friction setup for now if you want a free-tier Gemini key from Google AI Studio.

If you do not set these variables, the planner API will return an error until an LLM endpoint is configured.

## Usage

To create a CAD model, write a DSL script in the `examples/basic.dsl` file. Use the defined syntax to specify shapes and their properties.

## DSL Syntax Overview

- **Wall**: Define a wall with specific dimensions.
- **Prism**: Create a prism shape with height and width.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License.
