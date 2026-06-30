
import { JsonUtil } from "../../../../../extensions/oops-plugin-framework/assets/core/utils/JsonUtil";

export class TablelevelTable1 {
    static TableName: string = "levelTable1";

    private data: any;

    init(id: number) {
        var table = JsonUtil.get(TablelevelTable1.TableName);
        this.data = table[id];
        this.id = id;
    }

    /** 编号【KEY】 */
    id: number = 0;

    /** 关卡数据 */
    get levelData(): string {
        return this.data.levelData;
    }
    /** 生命值 */
    get lifeNum(): number {
        return this.data.lifeNum;
    }
    /** 关卡时间（秒） */
    get levelTime(): number {
        return this.data.levelTime;
    }
    /** 彩色箭头数量 */
    get colorNum(): number {
        return this.data.colorNum;
    }
}
    