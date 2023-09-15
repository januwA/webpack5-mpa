import dayjs from "dayjs";

export default {
  now() {
    console.log("now: ", dayjs().format());
  },
};
