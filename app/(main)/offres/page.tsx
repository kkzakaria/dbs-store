import { notFound } from "next/navigation";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// TODO: Re-enable when "Offres" feature is ready for launch
export default function OffresPage(_props: Props) {
  notFound();
}
