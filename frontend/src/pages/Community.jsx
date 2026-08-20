import { useState, useEffect } from "react";
import { useAutoExpire } from "../hooks/useAutoExpire";
import { MessageSquare, Heart, Flag, Trash2, Send } from "lucide-react";
import {
  postService,
  subscribeToNewPost,
  subscribeToPostDeleted,
  subscribeToNewComment,
  subscribeToPostUpvoted,
} from "../services/postService";
import { formatRelativeTime } from "../utils/time";
import { useToast, useConfirm } from "../components/ui/UIProvider";

function Community() {
  const { showToast } = useToast();
  const confirm = useConfirm();

  const currentUser = {
    anonymousId:
      sessionStorage.getItem("privatevoice_anonymous_id") || "Anonymous User",
  };

  const userRole =
    sessionStorage.getItem("privatevoice_role") || "member";
  const isAdmin = userRole === "admin";

  const [posts, setPosts] = useState([]);
  useAutoExpire(posts, setPosts, (post) => post.createdAt);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const data = await postService.getPosts();
      setPosts(data.posts || []);
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to load posts.", "error");
    }
  };

  useEffect(() => {
    const unsubscribeNewPost = subscribeToNewPost((incomingPost) => {
      setPosts((previous) => {
        if (
          previous.some((post) => post.id === incomingPost.id)
        )
          return previous;

        return [
          {
            ...incomingPost,
            liked: false,
            isOwner: false,
            replies: [],
          },
          ...previous,
        ];
      });
    });

    const unsubscribePostDeleted = subscribeToPostDeleted(
      ({ postId }) => {
        setPosts((previous) =>
          previous.filter((post) => post.id !== postId)
        );
      }
    );

    const unsubscribeNewComment = subscribeToNewComment(
      ({ postId, comment }) => {
        setPosts((previous) =>
          previous.map((post) => {
            if (post.id !== postId) return post;

            if (
              post.replies.some(
                (reply) => reply.id === comment.id
              )
            )
              return post;

            return {
              ...post,
              replies: [...post.replies, comment],
            };
          })
        );
      }
    );

    const unsubscribePostUpvoted = subscribeToPostUpvoted(
      ({ postId, likes }) => {
        setPosts((previous) =>
          previous.map((post) =>
            post.id === postId
              ? { ...post, likes }
              : post
          )
        );
      }
    );

    return () => {
      unsubscribeNewPost();
      unsubscribePostDeleted();
      unsubscribeNewComment();
      unsubscribePostUpvoted();
    };
  }, []);

  const [newPost, setNewPost] = useState("");
  const [replyText, setReplyText] = useState({});
  const [openReplies, setOpenReplies] = useState({});
  const [deletingId, setDeletingId] = useState(null);

  const handleCreatePost = async () => {
    const content = newPost.trim();

    if (!content) return;

    try {
      await postService.createPost(content);
      setNewPost("");
      fetchPosts();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Could not post.", "error");
    }
  };

  const handleDeletePost = async (postId) => {
    const ok = await confirm({
      title: "Delete this post?",
      message: "This cannot be undone.",
    });

    if (!ok) return;

    try {
      setDeletingId(postId);

      await postService.deletePost(postId);

      setPosts((previousPosts) =>
        previousPosts.filter(
          (post) => post.id !== postId
        )
      );

      showToast("Post deleted.", "success");
    } catch (err) {
      console.error(err);
      showToast(
        err.message || "Could not delete this post.",
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await postService.toggleUpvote(postId);

      setPosts((previousPosts) =>
        previousPosts.map((post) => {
          if (post.id !== postId) return post;

          return {
            ...post,
            liked: res.liked,
          };
        })
      );
    } catch (err) {
      console.error(err);
      showToast(
        err.message || "Could not update like.",
        "error"
      );
    }
  };

  const handleReply = async (postId) => {
    const text = replyText[postId]?.trim();

    if (!text) return;

    try {
      await postService.createComment(postId, text);

      setReplyText((previous) => ({
        ...previous,
        [postId]: "",
      }));

      setOpenReplies((previous) => ({
        ...previous,
        [postId]: true,
      }));

      fetchPosts();
    } catch (err) {
      console.error(err);
      showToast(
        err.message || "Could not post reply.",
        "error"
      );
    }
  };

  const toggleReplies = (postId) => {
    setOpenReplies((previous) => ({
      ...previous,
      [postId]: !previous[postId],
    }));
  };

  const handleReport = async (
    postId,
    targetType = "post"
  ) => {
    try {
      await postService.reportContent(
        targetType,
        postId,
        "Inappropriate content"
      );

      showToast(
        "Reported. Thank you for keeping the community safe.",
        "success"
      );
    } catch (err) {
      console.error(err);

      showToast(
        err.message || "Could not report content.",
        "error"
      );
    }
  };

  return (
    <div className="min-h-full bg-[#F7F8F7]">
      <div className="mx-auto w-full max-w-[1050px] pb-12">

        {/* ================= HEADER ================= */}

        <section className="relative overflow-hidden rounded-2xl border border-[#E1E7E4] bg-white px-6 py-7 shadow-[0_10px_30px_rgba(48,65,58,0.035)] sm:px-8">

          <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#EEF4F1]" />

          <div className="pointer-events-none absolute -bottom-16 -left-14 h-40 w-40 rounded-full bg-[#F6F0E7]" />

          <div className="relative">

            <div className="flex items-center gap-2">
              <span className="h-[2px] w-7 bg-[#78958B]" />

              <span className="text-[11px] font-bold uppercase tracking-[1.7px] text-[#78958B]">
                Community
              </span>
            </div>

            <div className="mt-4 flex flex-col justify-between gap-5 md:flex-row md:items-end">

              <div>
                <h1 className="text-[29px] font-semibold tracking-[-0.8px] text-[#202725] sm:text-[35px]">
                  Community conversations
                </h1>

                <p className="mt-3 max-w-[650px] text-[13px] leading-6 text-[#5B6863]">
                  A private space to share thoughts, discuss experiences, and hear different perspectives from your organization.
                </p>
              </div>

              <div className="flex w-fit shrink-0 items-center gap-3 rounded-xl border border-[#DFE8E3] bg-[#F7FAF8] px-3.5 py-2.5">

                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E5EFEA] text-[#557267]">
                  <MessageSquare size={13} />
                </span>

                <div>
                  <p className="text-[11px] font-semibold text-[#3D4844]">
                    Anonymous by default
                  </p>

                  <p className="mt-0.5 text-[10px] text-[#7C8985]">
                    {currentUser.anonymousId}
                  </p>
                </div>

              </div>

            </div>

            <div className="mt-6 flex items-center gap-2 text-[11px] text-[#6E7B76]">

              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#78958B]" />

              <span>
                Your real identity is never displayed to other members.
              </span>

            </div>

          </div>
        </section>


        {/* ================= START CONVERSATION ================= */}

        <section className="mt-7">

          <div className="mb-3 flex items-end justify-between">

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#78958B]">
                Your voice
              </p>

              <h2 className="mt-1 text-[19px] font-semibold text-[#2B3532]">
                Start a conversation
              </h2>
            </div>

            <span className="hidden text-[11px] text-[#8D9994] sm:block">
              Press Enter to post
            </span>

          </div>


          <div className="rounded-xl border border-[#E1E7E4] bg-white p-5 shadow-[0_8px_25px_rgba(48,65,58,0.03)] transition-all duration-300 hover:border-[#CCD9D3] sm:p-6">

            <div className="flex gap-4">

              <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF2EE] text-[11px] font-semibold text-[#557267] sm:flex">
                A
              </div>

              <div className="min-w-0 flex-1">

                <textarea
                  value={newPost}
                  onChange={(event) =>
                    setNewPost(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();
                      handleCreatePost();
                    }
                  }}
                  rows="3"
                  maxLength={500}
                  placeholder="Share something with your organization..."
                  className="w-full resize-none rounded-lg border-0 bg-[#FAFBFA] px-4 py-3.5 text-[13px] leading-6 text-[#2B3532] outline-none transition-all duration-300 placeholder:text-[#9AA4A0] focus:bg-white focus:ring-1 focus:ring-[#D7E3DD]"
                />

                <div className="mt-3 flex items-center justify-between">

                  <span className="text-[10px] text-[#8D9994]">
                    {newPost.length}/500
                  </span>

                  <button
                    type="button"
                    disabled={!newPost.trim()}
                    onClick={handleCreatePost}
                    className="group flex items-center gap-2 rounded-lg bg-[#718F84] px-5 py-2.5 text-[11px] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#5F7D72] hover:shadow-[0_8px_18px_rgba(95,125,114,0.2)] disabled:cursor-not-allowed disabled:bg-[#BFCBC5] disabled:shadow-none"
                  >
                    Post anonymously

                    <Send
                      size={13}
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </button>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* ================= COMMUNITY FEED ================= */}

        <section className="mt-11 rounded-2xl border border-[#E2E9E5] bg-[#F0F5F2] p-4 sm:p-5">

          {/* Feed Header */}

          <div className="flex items-end justify-between border-b border-[#D7E2DC] pb-4">

            <div>

              <div className="flex items-center gap-2">

                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E3EDE8] text-[#607D72]">
                  <MessageSquare size={12} />
                </span>

                <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#78958B]">
                  Community feed
                </p>

              </div>

              <h2 className="mt-2 text-[20px] font-semibold text-[#2B3532]">
                Recent conversations
              </h2>

              <p className="mt-1 text-[11px] text-[#7C8985]">
                Anonymous conversations from your community
              </p>

            </div>

            <span className="rounded-full bg-white/70 px-3 py-1.5 text-[10px] font-medium text-[#7C8985]">
              {posts.length} conversation
              {posts.length !== 1 ? "s" : ""}
            </span>

          </div>


          {/* Feed Content */}

          <div className="mt-5">

            {posts.length === 0 ? (

              <div className="rounded-xl border border-dashed border-[#D2DED8] bg-white/70 px-6 py-14 text-center">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF2EE] text-[#78958B]">
                  <MessageSquare size={20} />
                </div>

                <h3 className="mt-4 text-[14px] font-semibold text-[#3D4844]">
                  Nothing here yet
                </h3>

                <p className="mt-2 text-[12px] text-[#8D9994]">
                  Start the first conversation in your community.
                </p>

              </div>

            ) : (

              <div className="space-y-4">

                {posts.map((post, index) => {

                  const canDelete =
                    post.isOwner || isAdmin;

                  return (

                    <article
                      key={post.id}
                      className="group animate-[communityCardIn_0.45s_ease-out] rounded-2xl border border-[#DCE6E1] bg-white shadow-[0_5px_18px_rgba(48,65,58,0.035)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#C7D6CF] hover:shadow-[0_14px_30px_rgba(48,65,58,0.06)]"
                      style={{
                        animationDelay: `${index * 70}ms`,
                      }}
                    >

                      <div className="p-5 sm:p-6">

                        {/* User / Actions */}

                        <div className="flex items-start justify-between">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF4F1] text-[11px] font-semibold text-[#557267] transition-all duration-300 group-hover:bg-[#E5EFEA] group-hover:scale-105">
                              A
                            </div>

                            <div>

                              <p className="text-[12px] font-semibold text-[#3D4844]">

                                {post.anonymousId}

                                {post.isOwner && (
                                  <span className="ml-2 rounded-full bg-[#EEF4F1] px-2 py-[2px] text-[9px] font-semibold uppercase tracking-[0.5px] text-[#557267]">
                                    You
                                  </span>
                                )}

                              </p>

                              <p className="mt-0.5 text-[10px] text-[#8D9994]">
                                {formatRelativeTime(
                                  post.createdAt
                                )}
                              </p>

                            </div>

                          </div>


                          <div className="flex items-center gap-1">

                            {canDelete && (

                              <button
                                type="button"
                                disabled={
                                  deletingId === post.id
                                }
                                onClick={() =>
                                  handleDeletePost(post.id)
                                }
                                className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] text-[#8D9994] transition-all duration-200 hover:bg-[#FBF5F3] hover:text-[#94655D] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Trash2 size={12} />

                                {deletingId === post.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>

                            )}

                            {!post.isOwner && (

                              <button
                                type="button"
                                onClick={() =>
                                  handleReport(post.id)
                                }
                                className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] text-[#8D9994] transition-all duration-200 hover:bg-[#FBF5F3] hover:text-[#94655D]"
                              >
                                <Flag size={12} />
                                Report
                              </button>

                            )}

                          </div>

                        </div>


                        {/* Chat Bubble */}

                        <div className="mt-5 pl-0 sm:pl-[52px]">

                          <div className="relative rounded-2xl rounded-tl-md border border-[#E6ECE9] bg-[#F7FAF8] px-4 py-3.5 sm:px-5">

                            <span className="absolute -left-[6px] top-3 h-3 w-3 rotate-45 border-b border-l border-[#E6ECE9] bg-[#F7FAF8]" />

                            <p className="relative text-[13px] leading-6 text-[#3D4844]">
                              {post.content}
                            </p>

                          </div>

                        </div>


                        {/* Actions */}

                        <div className="mt-4 flex items-center gap-2 pl-0 sm:ml-[52px]">

                          <button
                            type="button"
                            onClick={() =>
                              handleLike(post.id)
                            }
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] transition-all duration-200 ${
                              post.liked
                                ? "bg-[#EAF2EE] font-semibold text-[#54786A]"
                                : "text-[#6E7B76] hover:bg-[#F0F5F2] hover:text-[#54786A]"
                            }`}
                          >
                            <Heart
                              size={13}
                              fill={
                                post.liked
                                  ? "currentColor"
                                  : "none"
                              }
                            />

                            {post.likes}
                          </button>


                          <button
                            type="button"
                            onClick={() =>
                              toggleReplies(post.id)
                            }
                            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] text-[#6E7B76] transition-all duration-200 hover:bg-[#F0F5F2] hover:text-[#54786A]"
                          >
                            <MessageSquare size={13} />

                            {post.replies.length}

                            <span>
                              {post.replies.length === 1
                                ? "reply"
                                : "replies"}
                            </span>
                          </button>

                        </div>

                      </div>


                      {/* ================= REPLIES ================= */}

                      {openReplies[post.id] && (

                        <div className="border-t border-[#E3EBE7] bg-[#F7FAF8] px-5 py-5 sm:px-6">

                          <div className="sm:ml-[52px]">

                            {post.replies.length > 0 && (

                              <div className="space-y-3">

                                {post.replies.map(
                                  (reply) => (

                                    <div
                                      key={reply.id}
                                      className="relative rounded-xl rounded-tl-md border border-[#E0E9E4] bg-white px-4 py-3 transition-all duration-200 hover:border-[#D1DDD7]"
                                    >

                                      <div className="flex items-center justify-between gap-3">

                                        <span className="text-[11px] font-semibold text-[#4F5D57]">
                                          {reply.anonymousId}
                                        </span>

                                        <span className="text-[10px] text-[#8D9994]">
                                          {formatRelativeTime(
                                            reply.createdAt
                                          )}
                                        </span>

                                      </div>

                                      <p className="mt-2 text-[12px] leading-5 text-[#525F5A]">
                                        {reply.content}
                                      </p>

                                    </div>

                                  )
                                )}

                              </div>

                            )}


                            {/* Reply Input */}

                            <div className="mt-4 flex gap-2">

                              <input
                                type="text"
                                value={
                                  replyText[post.id] || ""
                                }
                                onChange={(event) =>
                                  setReplyText(
                                    (previous) => ({
                                      ...previous,
                                      [post.id]:
                                        event.target.value,
                                    })
                                  )
                                }
                                onKeyDown={(event) => {
                                  if (
                                    event.key === "Enter"
                                  ) {
                                    event.preventDefault();
                                    handleReply(post.id);
                                  }
                                }}
                                placeholder="Write an anonymous reply..."
                                className="min-w-0 flex-1 rounded-xl border border-[#DCE6E1] bg-white px-3 py-2.5 text-[12px] text-[#3D4844] outline-none transition-all duration-200 placeholder:text-[#9AA4A0] focus:border-[#AFC2B9] focus:ring-4 focus:ring-[#EEF4F1]"
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  handleReply(post.id)
                                }
                                disabled={
                                  !replyText[
                                    post.id
                                  ]?.trim()
                                }
                                className="shrink-0 rounded-xl bg-[#718F84] px-4 py-2 text-[11px] font-semibold text-white transition-all duration-200 hover:bg-[#5F7D72] disabled:cursor-not-allowed disabled:bg-[#BFCBC5]"
                              >
                                Reply
                              </button>

                            </div>

                          </div>

                        </div>

                      )}

                    </article>

                  );
                })}

              </div>

            )}

          </div>

        </section>


        {/* ================= FOOTER ================= */}

        <section className="mt-10 border-t border-[#E1E6E3] py-7">

          <div className="flex flex-col items-center justify-center gap-2 text-center">

            <div className="flex items-center gap-2">

              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#78958B]" />

              <span className="text-[11px] font-medium text-[#5B6863]">
                A private conversation space
              </span>

            </div>

            <p className="max-w-[500px] text-[10px] leading-5 text-[#8D9994]">
              Share openly. Your anonymous identity keeps your real identity separate from your conversations.
            </p>

          </div>

        </section>

      </div>


      {/* ================= ANIMATION ================= */}

      <style>{`
        @keyframes communityCardIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

    </div>
  );
}

export default Community;