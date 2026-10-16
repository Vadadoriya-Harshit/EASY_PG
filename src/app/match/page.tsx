import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import SmartMatch from "@/components/SmartMatch";
import { listAreas, listProperties } from "@/lib/repo";

export const revalidate = 60;
export const metadata: Metadata = { title: "Smart PG Match", description: "Answer five quick questions and get PG matches with the reasons they fit." };

export default async function Match() {
  const [props, areas] = await Promise.all([listProperties(), listAreas()]);
  return (<><PageHeader title="Smart PG Match" intro="Five quick questions. Skip any you like." />
    <div className="container-x max-w-3xl py-12"><SmartMatch properties={props} areas={areas} /></div></>);
}
