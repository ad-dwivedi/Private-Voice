import { apiRequest } from "./apiClient";
import { socket } from "./socket";

export const postService = {
  getPosts: () => apiRequest("/api/community/posts"),

  createPost: (content) =>
    apiRequest("/api/community/posts", {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  deletePost: (id) =>
    apiRequest(`/api/community/posts/${id}`, { method: "DELETE" }),

  createComment: (postId, content) =>
    apiRequest(`/api/community/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  toggleUpvote: (postId) =>
    apiRequest(`/api/community/posts/${postId}/upvote`, { method: "POST" }),

  reportContent: (targetType, targetId, reason) =>
    apiRequest("/api/community/reports", {
      method: "POST",
      body: JSON.stringify({ targetType, targetId, reason }),
    }),
};

export const subscribeToNewPost = (callback) => {
  socket.on("community:post_new", callback);
  return () => socket.off("community:post_new", callback);
};

export const subscribeToPostDeleted = (callback) => {
  socket.on("community:post_deleted", callback);
  return () => socket.off("community:post_deleted", callback);
};

export const subscribeToNewComment = (callback) => {
  socket.on("community:comment_new", callback);
  return () => socket.off("community:comment_new", callback);
};

export const subscribeToPostUpvoted = (callback) => {
  socket.on("community:post_upvoted", callback);
  return () => socket.off("community:post_upvoted", callback);
};