import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { erro: null };
  }

  static getDerivedStateFromError(error) {
    return { erro: error };
  }

  render() {
    if (this.state.erro) {
      return (
        <div style={{ padding: 40, textAlign: "center" }}>
          <h1>Algo deu errado</h1>
          <p className="erro">{this.state.erro.message}</p>
          <button onClick={() => { this.setState({ erro: null }); window.location.href = "/"; }}>
            Voltar ao início
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
