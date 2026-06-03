import axios from "axios";

const mainApi = axios.create({
  // eslint-disable-next-line dot-notation
  baseURL: process.env.NEXT_PUBLIC_API_URL ,
});

export { mainApi };
