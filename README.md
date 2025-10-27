# cad-dsl-project

## Overview
This project implements a domain-specific language (DSL) for generating CAD-style models with physics simulations. The DSL allows users to define geometric shapes and their properties, which can then be rendered using Babylon.js and Three.js.

## Features
- **DSL Syntax**: Define models using a simple and intuitive syntax.
- **Rendering**: Integrate with Babylon.js and Three.js for rendering 3D models.
- **Physics Simulation**: Simulate physics interactions for the defined models.

## Project Structure
```
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

## Usage
To create a CAD model, write a DSL script in the `examples/basic.dsl` file. Use the defined syntax to specify shapes and their properties.

## DSL Syntax Overview
- **Wall**: Define a wall with specific dimensions.
- **Prism**: Create a prism shape with height and width.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.