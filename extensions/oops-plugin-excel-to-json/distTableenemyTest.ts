
import { JsonUtil } from "../../../../../extensions/oops-plugin-framework/assets/core/utils/JsonUtil";

export class TableenemyTest {
    static TableName: string = "enemyTest";

    private data: any;

    init(id: number) {
        var table = JsonUtil.get(TableenemyTest.TableName);
        this.data = table[id];
        this.id = id;
    }

    /** 编号【KEY】 */
    id: number = 0;

    /** 等级 */
    get level(): number {
        return this.data.level;
    }
    /** 血量 */
    get hp(): number {
        return this.data.hp;
    }
    /** 攻击力 */
    get attack(): number {
        return this.data.attack;
    }
    /** 升级最少时间 */
    get upgradeTimeMin(): number {
        return this.data.upgradeTimeMin;
    }
    /** 升级最大时间 */
    get upgradeTimeMax(): number {
        return this.data.upgradeTimeMax;
    }
}
    