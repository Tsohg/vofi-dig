import { Sprite, Texture } from "pixi.js";
import { Entity, World } from "../entities";
import { PositionComponent } from "./Position.component";
import { PlayerComponent } from "./player/Player.component";

export class SpriteComponent {
	static readonly COMPONENT_ID = "SpriteComponent" as const;
	parent!: Entity;
	world!: World;
	src!: string;
	sprite!: Sprite;
	position?: PositionComponent;
	anchorX = 0;
	anchorY = 0;
	layer="default";

	onInit({}) {
		const texture = Texture.from(this.src);
		this.sprite = new Sprite(texture);
		this.sprite.anchor.set(this.anchorX, this.anchorY);

		this.world.renderContainers[this.layer].addChild(this.sprite);
		this.position = this.parent.getComponent(PositionComponent);
	}

	onDestroy() {
		this.sprite.removeFromParent();
	}

	onUpdate(event) {
		this.sprite.position.set(this.position?.x, this.position?.y)
	}

	onMove({x}) {
		if (x * this.sprite.scale.x < 0)
			this.sprite.scale.x *= -1;
	}
}
