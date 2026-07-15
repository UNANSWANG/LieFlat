import { _decorator, Component, Node, Sprite, Vec2, Vec3 } from 'cc';
import { gm } from '../manager/gm';
import { audioManager, audioMgr } from '../manager/audioManager';
import { uiMgr } from '../manager/UIManager';
import { ccResTools } from './resTools';
import { configData } from '../manager/configData';
import { pData } from '../manager/playerData';
const { ccclass, property } = _decorator;

@ccclass('generalTools')
export class generalTools {
    /**显示指定子节点 */
    showChildByIdx(parent: Node, idx: number) {
        for (let i = 0; i < parent.children.length; i++) {
            parent.children[i].active = i == idx;
        }
    }

    /**显示指定数组索引节点 */
    showArrayByIdx(arr: Node[], idx: number) {
        for (let i = 0; i < arr.length; i++) {
            arr[i].active = i == idx;
        }
    }

    /**销毁并移除所有子节点 */
    destroyAllChild(parent: Node) {
        for (let i = parent.children.length - 1; i >= 0; i--) {
            let childNode = parent.children[i];
            childNode.removeFromParent();
            childNode.destroy();
        }
    }

    /**获得方向 */
    GetDir(x1: number, y1: number, x2: number, y2: number) {
        const dx = x2 - x1;
        const dy = y2 - y1;

        // 计算距离并归一化为单位向量
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) {
            return new Vec2(0, 0);
        }

        return new Vec2(dx / distance, dy / distance);
    }

    /**获得数据向无穷大取整 */
    ceilInteger(num: number) {
        if (num === 0) return 0;
        return Math.ceil(Math.abs(num)) * (num > 0 ? 1 : -1);
    }

    /**计算两点间距离的辅助函数 */
    calculateDistance(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**获取中文数字(0-10) */
    getChineseNum(num: number) {
        switch (num) {
            case 0:
                return "零";
            case 1:
                return "一";
            case 2:
                return "二";
            case 3:
                return "三";
            case 4:
                return "四";
            case 5:
                return "五";
            case 6:
                return "六";
            case 7:
                return "七";
            case 8:
                return "八";
            case 9:
                return "九";
            case 10:
                return "十";
            default:
                return num.toString();
        }
    }

    /**震动 */
    vibrate() {
        if (audioMgr.isVibrat) {
            gm.API.vibrateShort();
        }
    }

    /**异步加载图片进sprite */
    async loadImg(sprite: Sprite, url: string) {
        url += "/spriteFrame";
        let img = await ccResTools.loadPic(uiMgr.resBundle, url);
        if (!img) {
            console.log("加载图片失败", url);
            return;
        }
        sprite.spriteFrame = img;
    }

    /**异步加载远端图片进sprite */
    async loadUrlImg(sprite: Sprite, url: string) {
        let img = await ccResTools.loadPicByUrl(url);
        if (!img) {
            console.log("加载图片失败", url);
            return;
        }
        sprite.spriteFrame = img;
    }

    /**打乱数组顺序 */
    shuffleArray<T>(arr: T[]) {
        for (let i = arr.length - 1; i > 0; i--) {
            let randomIdx = Math.floor(Math.random() * (i + 1));
            let temp = arr[i];
            arr[i] = arr[randomIdx];
            arr[randomIdx] = temp;
        }
    }

    /**获取随机数字（左闭右开） */
    getRandomNum(min: number, max: number) {
        if(min >= max){
            return min;
        }
        return Math.floor(Math.random() * (max - min) + min);
    }

    /**通过坐标获取瓦片索引 */
    getTileIndexByPos(x, y) {
        let tileX = Math.floor(x / configData.tileSize);
        let tileY = Math.floor(y / configData.tileSize);
        return new Vec2(tileX, tileY);
    }

    /**通过坐标获取瓦片索引 */
    getTileIndexByNodePos(nodePos: Vec3) {
        let x = nodePos.x + pData.mapHalfSize.x;
        let y = pData.mapHalfSize.y - nodePos.y;
        let tileX = Math.floor(x / configData.tileSize);
        let tileY = Math.floor(y / configData.tileSize);
        return new Vec2(tileX, tileY);
    }

    /**通过瓦片索引获取坐标 */
    getPosByTileIndex(tilePos: Vec2) {
        // 计算瓦片在世界空间中的位置（左上角为原点）
        const tileWorldX = tilePos.x * configData.tileSize;
        const tileWorldY = tilePos.y * configData.tileSize;

        // 转换为以地图中心为原点的坐标系
        const localX = tileWorldX - pData.mapHalfSize.x + (configData.tileSize / 2);
        const localY = pData.mapHalfSize.y - tileWorldY - (configData.tileSize / 2); // Y轴翻转，因为瓦片坐标系Y轴向下，而本地坐标系Y轴向上

        return new Vec3(localX, localY, 0);
    }

    /**获取名称内的字符串，数字 */
    getNameData(name: string) {
        let matchData = name.match(/^([^\d]*)(\d+)$/);
        let nameData = matchData ? [matchData[1], Number(matchData[2])] : [name, 0];
        return nameData;
    }

    /**检测是否可以购买 */
    checkCanBuy(propsData: any) {
        if ((!propsData.coin || propsData.coin <= pData.gameCoin) && (!propsData.power || propsData.power <= pData.gamePower)) {
            return true;
        }
        return false;
    }
}
export let ccTools = new generalTools();
