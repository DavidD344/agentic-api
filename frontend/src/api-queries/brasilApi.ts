import axios from "axios";

const brasilApi = axios.create({
  // eslint-disable-next-line dot-notation
  baseURL:"https://brasilapi.com.br/api/cep/v2",
});

export { brasilApi };