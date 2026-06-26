import { useState, useEffect } from 'react';
import io from 'socket.io-client';

const useLiveFeed = (url = 'http://localhost:5000') => {
  const [socket, setSocket] = useState(null);
  const [newIssues, setNewIssues] = useState([]);

  useEffect(() => {
    // Initialize the socket connection
    const newSocket = io(url);
    setSocket(newSocket);

    // Listen for new issues from the server
    newSocket.on('newIssue', (issue) => {
      setNewIssues((prevIssues) => [issue, ...prevIssues]);
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [url]);

  return { socket, newIssues };
};

export default useLiveFeed;
