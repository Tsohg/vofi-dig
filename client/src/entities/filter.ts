import { Component } from "../components";
import { PositionComponent } from "../components/Position.component";
import { ChunkLoaderComponent } from "../components/player/ChunkLoader.component";

export type IEntityFilter = (types: (new() => any)[], groups: Component[][]) => void;

export function OnChunk(x: number, y: number, distance: number = 0): IEntityFilter {
	const id = PositionComponent.COMPONENT_ID
	return (types, groups) => {
		const index = types.findIndex((type) => type["COMPONENT_ID"] === id);
		if (index < 0)
			return;
		groups[index] = (groups[index] as PositionComponent[])
			.filter((position) => 
				Math.max(Math.abs(position.chunkX - x), Math.abs(position.chunkY - y)) <= distance
			);
	}
}
