import { Application } from "pixi.js";
import { registerComponents } from "./components/registry";
import { Entity, World, createWorld } from "./entities";
import { initControls, updateControls } from "./systems/controls";
import { PositionComponent } from "./components/Position.component";
import { GameConfig } from "./config";
import { ChunkLoaderComponent } from "./components/player/ChunkLoader.component";
import { UpdateComponent } from "./components/Update.component";
import { Socket } from "socket.io-client";
import { registerEntityBlueprints } from "./entities/registry";
import { ClientActorComponent } from "./components/network/ClientActor.component";
import { LocalStorage } from "./systems/storage";
import { PlayerComponent } from "./components/player/Player.component";
import { PlayerSkinComponent } from "./components/player/PlayerSkin.component";

export async function Init(app: Application, socket: Socket) {
	registerComponents();
	await registerEntityBlueprints();
	await initControls(app);

	const world = createWorld(app, socket);

	const mapSize = 150;

	await world.networkHandler.getState();
	const { userId, entities, spawn } = await world.networkHandler.initGame();
	LocalStorage.setUserId(userId);
	LocalStorage.clearEntities(entities);
	entities.forEach((id) => LoadClientEntity(id, world));

	world.addEntity("Fren", { x: 16, y: mapSize * 16 - 116 });
	
	const player = getOrCreatePlayer(world, {...spawn});
	const position = player.getComponent(PositionComponent);
	player
		.getComponent(ChunkLoaderComponent)
		.updateAllChunks({x: position.chunkX, y: position.chunkY});

	world.addEntity("Slime", {x: spawn.x, y: spawn.y});
	world.addEntity("Slime", {x: spawn.x-4, y: spawn.y});
	world.addEntity("Slime", {x: spawn.x+4, y: spawn.y});

	app.ticker.add((dt) => {
		world.queryEntity(UpdateComponent)[0]
			.map((c) => c.update({dt}));
		updateControls();
	});

	document.addEventListener("keydown", (event) => {
		if (event.code == "KeyO") {
			if (ChunkLoaderComponent.main) {
				ChunkLoaderComponent.main.updateAllChunks(position.chunk);
			} else {
				console.error("ChunkLoaderComponent.main not found!");
			}
		}
		if (event.code == "KeyL") {
			const clientActors = world.queryEntity(ClientActorComponent)[0];
			clientActors.forEach(LoadClientActor);
		}
	});

	document.addEventListener("visibilitychange", () =>{
		if (document.visibilityState !== "hidden")
			return;
		const clientActors = world.queryEntity(ClientActorComponent)[0];
		clientActors.forEach(SaveClientActor);
	});
}

function SaveClientActor(clientActor: ClientActorComponent) {
	const id = clientActor.parent.id;
	const components = Entity.serialize(clientActor.parent);
	const data = {
		components,
		entityBlueprint: clientActor.clientEntity
	};
	LocalStorage.updateEntity(id, data);
}

function LoadClientActor(clientActor: ClientActorComponent) {
	const data = LocalStorage.getEntity(clientActor.parent.id);
	Entity.deserialize(clientActor.parent, data)
}

function LoadClientEntity(entityId: number, world: World) {
	const data = LocalStorage.getEntity(entityId);
	if (!data)
		return;
	const entity = world.addEntity(data.entityBlueprint, {}, entityId);
	Entity.deserialize(entity, data.components);
}

function getOrCreatePlayer(world: World, props: object) {
	let players = world.queryEntity(PlayerComponent)[0];
	if (players.length === 0) {
		const player = world.addEntity("Player", props);
		player.getComponent(PlayerSkinComponent).randomize();
		return player;
	}
	return players[0].parent;
}