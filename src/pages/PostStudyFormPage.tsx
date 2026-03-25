import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context";
import { savePostStudyResponse } from "@/utils";

const PostStudyFormPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [responses, setResponses] = useState({
    q1: "",
    q2: "",
    q3: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    savePostStudyResponse(user.id, responses);
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white px-4 py-6 md:py-10">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900">Post-Study Form</h1>
        <p className="text-sm text-gray-500 mt-2">
          This page is accessible from the Gallery floating button only.
        </p>

        {submitted ? (
          <div className="mt-6 p-4 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800">
            Response saved successfully.
            <button
              onClick={() => navigate("/gallery")}
              className="block mt-3 text-sm font-medium text-emerald-700 underline"
            >
              Back to Gallery
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <textarea
              value={responses.q1}
              onChange={(e) => setResponses((prev) => ({ ...prev, q1: e.target.value }))}
              className="w-full p-3 rounded-lg border border-gray-300"
              placeholder="Question 1 response (placeholder)"
            />
            <textarea
              value={responses.q2}
              onChange={(e) => setResponses((prev) => ({ ...prev, q2: e.target.value }))}
              className="w-full p-3 rounded-lg border border-gray-300"
              placeholder="Question 2 response (placeholder)"
            />
            <textarea
              value={responses.q3}
              onChange={(e) => setResponses((prev) => ({ ...prev, q3: e.target.value }))}
              className="w-full p-3 rounded-lg border border-gray-300"
              placeholder="Question 3 response (placeholder)"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg bg-gray-900 text-white font-medium hover:bg-black disabled:opacity-70"
            >
              {isSubmitting ? "Saving..." : "Submit Responses"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PostStudyFormPage;
