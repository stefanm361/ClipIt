import React, { useState, useRef } from "react";

export const useToggle = () => {
  const [status, setStatus] = useState(false);
  const toggleStatus = () => setStatus((prevStatus) => !prevStatus);

  return { status, toggleStatus };
};