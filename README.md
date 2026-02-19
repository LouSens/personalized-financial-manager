# Personlized Financial Manager

A comprehensive, modern financial management application designed to help users track their finances, manage accounts, analyze transactions, and monitor investment portfolios. Built with React 19, TypeScript, and Tailwind CSS, this application offers a responsive and intuitive user interface for personal finance.

## 🚀 Features

- **Dashboard Overview**: Get a bird's-eye view of your financial health with interactive charts and key metrics.
- **Account Management**: Easily add, edit, and track various financial accounts (Banks, Credit Cards, etc.).
- **Transaction Tracking**: Log income and expenses with detailed categorization and date tracking.
- **Portfolio Monitoring**: Manage your investment portfolio and track asset performance.
- **Visual Analytics**: Beautiful, interactive charts powered by [Recharts](https://recharts.org/) to visualize income, expenses, and trends.
- **Data Export**: Export your financial data to Excel for external analysis.
- **Modern UI/UX**: A sleek, responsive design accessed through a clean interface built with [Tailwind CSS](https://tailwindcss.com/) and [Lucide Icons](https://lucide.dev/).
- **State Management**: Efficient global state management using [Zustand](https://github.com/pmndrs/zustand).

## 🛠️ Tech Stack

- **Frontend Framework**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Routing**: [React Router](https://reactrouter.com/)
- **Charting**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Date Handling**: [date-fns](https://date-fns.org/)
- **Utilities**: [xlsx](https://sheetjs.com/), [uuid](https://github.com/uuidjs/uuid)

## 📦 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/personalized-financial-manager.git
    cd personalized-financial-manager
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

### Running the Application

Start the development server:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173` (or the URL shown in your terminal).

## 🏗️ Building for Production

To build the application for production:

```bash
npm run build
```

This will compile the TypeScript code and bundle the application into the `dist` directory, ready for deployment.

You can preview the production build locally using:

```bash
npm run preview
```

## 📂 Project Structure

```
src/
├── assets/         # Static assets like images (if any)
├── components/     # Reusable UI components
│   ├── ui/         # Generic UI elements (buttons, inputs, etc.)
│   └── ...         # Feature-specific components (Forms, Layouts)
├── pages/          # Main application pages (Dashboard, Accounts, etc.)
├── store/          # Zustand state stores
├── types/          # TypeScript type definitions
├── utils/          # Helper functions and utilities
├── App.tsx         # Main application component
├── main.tsx        # Entry point
└── index.css       # Global styles and Tailwind directives
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is open source and available under the information [MIT License](LICENSE).
