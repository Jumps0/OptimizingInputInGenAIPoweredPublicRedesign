import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/context";

const WelcomePage = () => {
	const { user } = useAuth();

	const methodCopy: Record<"text" | "voice" | "inpainting" | "dragdrop", { title: string; description: string }> = {
		text: {
			title: "Text Input",
			description: "Type out clear instructions that describe exactly what should change in the image.",
		},
		voice: {
			title: "Voice Input",
			description: "Speak your edit request naturally. Tap the button to start recording. Tap it again to stop recording. Then review the transcription before generating. Transcript request can be reset by hitting the reset button. ",
		},
		inpainting: {
			title: "Inpainting Input",
			description: "Brush over the image with your finger to specify where you want something changed. Then provide a clear instruction for the desired modification. You can erase, clear, or undo/redo your selection area if needed.",
		},
		dragdrop: {
			title: "Drag-and-Drop Input",
			description: "Using the provided 'stickers', drag them onto the image to apply the changes you want. Stickers can also be removed by hitting the red 'X'.",
		},
	};

	const assignedMethodCard = user ? methodCopy[user.assignedMethod] : null;

	return (
		<section className="min-h-[calc(100vh-5rem)] px-4 py-12 sm:px-6 lg:px-8">
			<div className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
				<p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
					Welcome
				</p>
				<h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-4xl">
					Thank you for choosing to participate in our project. This page will give you instructions on how to use this web-app and what tasks you will be performing.
				</h1>
				<p className="text-base leading-7 text-slate-600">
					This web-app will allow you to take a photo with your camera of an <span className="text-base leading-7 text-slate-700 font-semibold">open environment you want to change in some way.</span> You will then be able to edit this photo using AI image generation through a specific instruction input.
				</p>

				{assignedMethodCard && (
					<div className="rounded-lg border border-blue-300 bg-blue-100/50 p-4">
						<p className="text-sm font-bold text-blue-900">{assignedMethodCard.title}</p>
						<p className="mt-1 text-sm leading-6 text-blue-800">{assignedMethodCard.description}</p>
					</div>
				)}

				<p className="text-base leading-7 text-slate-600">
					Once you have specified what you want changed on your input image, hit the <span className="text-base leading-7 text-slate-700 font-semibold">"Generate"</span> button. 
					 This process will take from <span className="text-base leading-7 text-slate-700 font-semibold">10 to 30 seconds</span>.
					 After the generation is done, the app will display <span className="text-base leading-7 text-slate-700 font-semibold">three variants</span> for you to choose from. You can tap on an image to <span className="text-base leading-7 text-slate-700 font-semibold">select it</span>, and then compare it with your original input photo.
					At this point you can choose to start over with the same initial image, continue refining the selected image with more edits, or finish editing the selected image and <span className="text-base leading-7 text-slate-700 font-semibold">exit to the gallery.</span>
				</p>

				<div className="rounded-lg border border-orange-300 bg-orange-100/50 p-4">
					<p className="text-sm font-semibold text-orange-900">Instructions</p>
					<p className="mt-1 text-sm leading-6 text-orange-800">To complete your task, <span className="mt-1 text-sm font-semibold leading-6 text-orange-800">capture and edit four separate images.</span> Once you are finished, go to the gallery, and complete the 'post-use survey'.</p>
					<p className="mt-1 text-sm leading-6 text-orange-800">You <span className="mt-1 text-sm font-semibold leading-6 text-orange-800">must</span> perform this study in the <span className="mt-1 text-sm font-semibold leading-6 text-orange-800">Teglgårds Plads </span>at Nordkraft in Aalborg.</p>
				</div>

				<p className="text-base leading-7 text-slate-600">
					Click the button below to get started.
				</p>

				<div className="mt-auto pt-6">
					<Link
						to="/editor"
						className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500/50 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-600/50"
					>
						Continue to Editor
						<ArrowRight className="h-4 w-4" />
					</Link>
				</div>
			</div>
		</section>
	);
};

export default WelcomePage;
