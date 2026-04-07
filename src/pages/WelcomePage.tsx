import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const WelcomePage = () => {
	return (
		<section className="min-h-[calc(100vh-5rem)] px-4 py-12 sm:px-6 lg:px-8">
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
				<p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
					Welcome
				</p>
				<h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
					Text
				</h1>
				<p className="text-base leading-7 text-slate-600">
					Text
				</p>

				<div className="pt-2">
					<Link
						to="/editor"
						className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
					>
						Go to Editor
						<ArrowRight className="h-4 w-4" />
					</Link>
				</div>
			</div>
		</section>
	);
};

export default WelcomePage;
