
import { JsonUtil } from "../../../../../extensions/oops-plugin-framework/assets/core/utils/JsonUtil";

export class TablelevelTable2 {
    static TableName: string = "levelTable2";

    private data: any;

    init(id: number) {
        var table = JsonUtil.get(TablelevelTable2.TableName);
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
    /** 是否为冲刺关卡 */
    get isSprint(): number {
        return this.data.isSprint;
    }
}
    