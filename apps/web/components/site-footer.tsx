import Link from "next/link";
import { Heart } from "lucide-react";
import { SiGithub } from "@icons-pack/react-simple-icons";

import { Separator } from "@/components/ui/separator";

const footerLinks = {
	product: [
		{ href: "/questions", label: "Question Library" },
		{ href: "/dashboard", label: "Practice Dashboard" },
		{ href: "/credits", label: "Credits & Attribution" },
	],
	resources: [
		{
			href: "https://github.com/lydiahallie/javascript-questions",
			label: "Original Repository",
			external: true,
		},
		{
			href: "https://github.com/lydiahallie",
			label: "Lydia Hallie",
			external: true,
		},
	],
};

export function SiteFooter() {
	return (
		<footer className="mt-20 border-t border-border bg-surface/50">
			<div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
				<div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
					{/* Brand */}
					<div className="sm:col-span-2 lg:col-span-2">
						<Link
							href="/"
							className="inline-flex items-center gap-2 font-display text-lg font-medium text-foreground"
						>
							JS Interview Atlas
						</Link>
						<p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
							An open-source JavaScript interview practice platform. Built with
							respect for the original content creators and the learning
							community.
						</p>
						<div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
							<Heart className="h-3.5 w-3.5 text-danger" />
							<span>Built from Lydia Hallie&apos;s JavaScript Questions</span>
						</div>
					</div>

					{/* Product links */}
					<div>
						<h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Product
						</h3>
						<ul className="mt-3 space-y-2">
							{footerLinks.product.map((link) => (
								<li key={link.href}>
									<Link
										href={link.href}
										className="text-sm text-muted-foreground transition-colors hover:text-foreground"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* Resources */}
					<div>
						<h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Resources
						</h3>
						<ul className="mt-3 space-y-2">
							{footerLinks.resources.map((link) => (
								<li key={link.href}>
									<Link
										href={link.href}
										target={link.external ? "_blank" : undefined}
										rel={link.external ? "noopener noreferrer" : undefined}
										className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
									>
										{link.label}
										{link.external && <SiGithub className="h-3 w-3" />}
									</Link>
								</li>
							))}
						</ul>
					</div>
				</div>

				<Separator className="my-8" />

				<div className="flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
					<p>
						Content licensed under{" "}
						<Link
							href="https://github.com/lydiahallie/javascript-questions/blob/master/LICENSE"
							target="_blank"
							rel="noopener noreferrer"
							className="text-foreground underline underline-offset-2"
						>
							MIT License
						</Link>
					</p>
					<p className="text-muted-foreground/60">Practice. Learn. Ship.</p>
				</div>
			</div>
		</footer>
	);
}
