import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context";
import { savePostStudyResponse } from "@/utils";

type YesNoOption = "Yes" | "No";

type RatingOption = "1" | "2" | "3" | "4" | "5";

interface PostStudyResponses extends Record<string, string> {
  awareOfAI: YesNoOption | "";
  usedAI: YesNoOption | "";
  easyToUse: RatingOption | "";
  expressIdeas: RatingOption | "";
  matchedExpectation: RatingOption | "";
  easyEdit: RatingOption | "";
  feltEngaged: RatingOption | "";
  overallSatisfaction: RatingOption | "";
  followUpInterview: YesNoOption;
  additionalComments: string;
}

const yesNoOptions: YesNoOption[] = ["Yes", "No"];
const ratingOptions: RatingOption[] = ["1", "2", "3", "4", "5"];

const PostStudyFormPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [responses, setResponses] = useState<PostStudyResponses>({
    awareOfAI: "",
    usedAI: "",
    easyToUse: "",
    expressIdeas: "",
    matchedExpectation: "",
    easyEdit: "",
    feltEngaged: "",
    overallSatisfaction: "",
    followUpInterview: "No",
    additionalComments: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const hasAnsweredEveryQuestion = Object.entries(responses)
    .filter(([key]) => key !== "additionalComments")
    .every(([, value]) => value !== "");

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("Submitting responses...");
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await savePostStudyResponse(user.id, responses);
      console.log("Responses saved successfully");
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit responses. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-6 md:py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900">Post-Study Form</h1>
        <p className="text-sm text-blue-700 mt-2">
          Please answer the following questions about your experience and then hit <span className="font-medium font-semibold text-blue-700">'Submit Responses'</span> to finish the study.
        </p>

        {submitted ? (
          <div className="mt-6 p-4 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800">
            Response saved successfully. Thank you for participating in our study! You can now close this page.
            <button
              onClick={() => navigate("/gallery")}
              className="block mt-3 text-sm font-medium text-emerald-700 underline"
            >
              Back to Gallery
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-8">
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Prior Experience</h2>
              <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <fieldset>
                  <legend className="text-sm font-medium text-gray-800">
                    Before this study, were you aware of AI image editing technology?
                  </legend>
                  <div className="mt-3 flex gap-4">
                    {yesNoOptions.map((option) => (
                      <label key={option} className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="radio"
                          name="awareOfAI"
                          value={option}
                          checked={responses.awareOfAI === option}
                          onChange={(e) =>
                            setResponses((prev) => ({ ...prev, awareOfAI: e.target.value as YesNoOption }))
                          }
                          className="h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-500"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-sm font-medium text-gray-800">
                    Before this study, have you ever used AI to edit an image?
                  </legend>
                  <div className="mt-3 flex gap-4">
                    {yesNoOptions.map((option) => (
                      <label key={option} className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="radio"
                          name="usedAI"
                          value={option}
                          checked={responses.usedAI === option}
                          onChange={(e) =>
                            setResponses((prev) => ({ ...prev, usedAI: e.target.value as YesNoOption }))
                          }
                          className="h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-500"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">User Satisfaction</h2>
              <p className="text-sm text-blue-700">
                Please <span className="font-medium font-semibold text-blue-700">rate your agreement</span> with the following statements (1 = Strongly Disagree, 5 = Strongly Agree)
              </p>

              {[
                { key: "easyToUse", label: "The app was easy to use." },
                { key: "expressIdeas", label: "I was able to clearly express my ideas." },
                { key: "matchedExpectation", label: "The final image I selected matched what I had in mind." },
                { key: "easyEdit", label: "I found it easy to refine or edit the image to get closer to what I want." },
                { key: "feltEngaged", label: "I felt engaged while using the app." },
                { key: "overallSatisfaction",  label: `Overall, I was satisfied with my experience.`, },
              ].map((question) => (
                <fieldset key={question.key} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <legend className="text-sm font-medium text-gray-800">{question.label}</legend>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {ratingOptions.map((option) => (
                      <label key={option} className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="radio"
                          name={question.key}
                          value={option}
                          checked={responses[question.key as keyof PostStudyResponses] === option}
                          onChange={(e) =>
                            setResponses((prev) => ({
                              ...prev,
                              [question.key]: e.target.value,
                            }))
                          }
                          className="h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-500"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </section>

            <section className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h2 className="text-lg font-semibold text-gray-900">Additional Information</h2>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="followUpInterview"
                  checked={responses.followUpInterview === "Yes"}
                  onChange={(e) =>
                    setResponses((prev) => ({
                      ...prev,
                      followUpInterview: e.target.checked ? "Yes" : "No",
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                />
                I'm open to participating in a follow-up interview about my experience.
              </label>
              <p className="text-sm text-orange-600">
                If you check this box we will reach out shortly to schedule an online meeting.
              </p>
              <label htmlFor="additionalComments" className="text-sm font-medium text-blue-700">
                (Optional) Have any other comments or feedback? Leave it here.
              </label>
              <textarea
                id="additionalComments"
                name="additionalComments"
                rows={4}
                value={responses.additionalComments}
                onChange={(e) =>
                  setResponses((prev) => ({
                    ...prev,
                    additionalComments: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </section>

            <button
              type="submit"
              disabled={isSubmitting || !hasAnsweredEveryQuestion}
              className="w-full py-3 rounded-lg bg-green-700 text-white font-medium hover:bg-green-900 disabled:opacity-70"
            >
              {isSubmitting ? "Saving..." : "Submit Responses"}
            </button>

            {submitError ? (
              <p className="text-sm text-red-700" role="alert">
                {submitError}
              </p>
            ) : null}
          </form>
        )}
      </div>
    </div>
  );
};

export default PostStudyFormPage;
