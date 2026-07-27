import { _decorator, Component, Node, sp, Sprite, Vec2, Vec3 } from 'cc';
import { gm } from '../manager/gm';
import { audioManager, audioMgr } from '../manager/audioManager';
import { uiMgr } from '../manager/UIManager';
import { ccResTools } from './resTools';
import { configData } from '../manager/configData';
import { pData } from '../manager/playerData';
const { ccclass, property } = _decorator;

@ccclass('generalTools')
export class generalTools {
    /**BFS复用缓冲区，容量按运行时遇到的最大地图动态增长 */
    private pathVisited: Uint32Array = new Uint32Array(0);
    private pathParent: Int32Array = new Int32Array(0);
    private pathQueue: Int32Array = new Int32Array(0);
    /**用递增版本区分每次寻路，避免每次搜索都清空visited数组 */
    private pathVisitVersion = 0;
    /**四方向移动偏移，避免寻路时反复创建方向对象 */
    private readonly pathDirX = [1, -1, 0, 0];
    private readonly pathDirY = [0, 0, 1, -1];

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
        if (!sprite || !sprite.isValid || !url) {
            return false;
        }

        // 同一组件后发请求会提升版本，先发请求完成后不会回写旧资源
        let loadVersion = this.beginAssetLoad(sprite);
        url += "/spriteFrame";
        let img = await ccResTools.loadPic(uiMgr.resBundle, url);
        if (!img) {
            console.log("加载图片失败", url);
            return false;
        }
        if (!this.isAssetLoadCurrent(sprite, loadVersion)) {
            return false;
        }
        sprite.spriteFrame = img;
        return true;
    }

    /**异步加载远端图片进sprite */
    async loadUrlImg(sprite: Sprite, url: string) {
        if (!sprite || !sprite.isValid || !url) {
            return false;
        }

        // 记录本次请求版本，防止节点复用后写入上一用途的图片
        let loadVersion = this.beginAssetLoad(sprite);
        let img = await ccResTools.loadPicByUrl(url);
        if (!img) {
            console.log("加载图片失败", url);
            return false;
        }
        if (!this.isAssetLoadCurrent(sprite, loadVersion)) {
            return false;
        }
        sprite.spriteFrame = img;
        return true;
    }

    /**异步加载spine进Skeleton */
    async loadSpine(skeleton: sp.Skeleton, url: string) {
        if (!skeleton || !skeleton.isValid || !url) {
            return false;
        }

        // 记录本次请求版本，防止异步完成时Skeleton已被回池或改作他用
        let loadVersion = this.beginAssetLoad(skeleton);
        let spinePath = this.getSpineLoadPath(url);
        let spineData = await ccResTools.loadSpine(uiMgr.resBundle, spinePath);
        if (!spineData) {
            console.log("加载spine失败", url);
            return false;
        }
        if (!this.isAssetLoadCurrent(skeleton, loadVersion)) {
            return false;
        }

        skeleton.skeletonData = spineData;
        return true;
    }

    /**使组件上尚未完成的异步资源请求失效 */
    cancelAssetLoad(component: Component) {
        if (!component) {
            return;
        }
        this.beginAssetLoad(component);
    }

    /**创建组件级资源请求版本 */
    private beginAssetLoad(component: Component) {
        let target = component as any;
        let version = (Number(target.__asyncAssetLoadVersion) || 0) + 1;
        target.__asyncAssetLoadVersion = version;
        return version;
    }

    /**确认组件仍有效且本次请求仍是最后一次请求 */
    private isAssetLoadCurrent(component: Component, version: number) {
        return !!component && component.isValid && (component as any).__asyncAssetLoadVersion == version;
    }

    /**获取spine加载路径，只有role和boss需要通过目录名拼资源名 */
    private getSpineLoadPath(url: string) {
        if (!url.startsWith("spine/role/") && !url.startsWith("spine/boss/")) {
            return url;
        }

        let pathArr = url.split("/");
        let dirName = pathArr[pathArr.length - 1] || "";
        let spineName = dirName.split("_")[0] || dirName;
        return `${url}/${spineName}`;
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

    /**通过坐标获取瓦片索引；传入out时复用结果对象 */
    getTileIndexByPos(x, y) {
        let tileX = Math.floor(x / configData.tileSize);
        let tileY = Math.floor(y / configData.tileSize);
        return new Vec2(tileX, tileY);
    }

    /**通过坐标获取瓦片索引 */
    getTileIndexByNodePos(nodePos: Vec3, out?: Vec2) {
        let x = nodePos.x + pData.mapHalfSize.x;
        let y = pData.mapHalfSize.y - nodePos.y;
        let tileX = Math.floor(x / configData.tileSize);
        let tileY = Math.floor(y / configData.tileSize);
        let result = out || new Vec2();
        result.set(tileX, tileY);
        return result;
    }

    /**通过瓦片索引获取坐标；传入out时复用结果对象 */
    getPosByTileIndex(tilePos: Vec2, out?: Vec3) {
        // 计算瓦片在世界空间中的位置（左上角为原点）
        const tileWorldX = tilePos.x * configData.tileSize;
        const tileWorldY = tilePos.y * configData.tileSize;

        // 转换为以地图中心为原点的坐标系
        const localX = tileWorldX - pData.mapHalfSize.x + (configData.tileSize / 2);
        const localY = pData.mapHalfSize.y - tileWorldY - (configData.tileSize / 2); // Y轴翻转，因为瓦片坐标系Y轴向下，而本地坐标系Y轴向上

        let result = out || new Vec3();
        result.set(localX, localY, 0);
        return result;
    }

    /**按当前地图实际尺寸执行BFS寻路，内部缓冲区循环复用 */
    findGridPath(width: number, height: number, startPos: Vec2, targetPos: Vec2, canWalk: (x: number, y: number) => boolean) {
        width = Math.max(0, Math.floor(width));
        height = Math.max(0, Math.floor(height));
        if (width <= 0 || height <= 0 || !startPos || !targetPos || !canWalk) {
            return [];
        }

        let startX = Math.floor(startPos.x);
        let startY = Math.floor(startPos.y);
        let targetX = Math.floor(targetPos.x);
        let targetY = Math.floor(targetPos.y);
        if (startX < 0 || startY < 0 || startX >= width || startY >= height
            || targetX < 0 || targetY < 0 || targetX >= width || targetY >= height) {
            return [];
        }

        let total = width * height;
        // 按实际地图格子数扩容，不使用固定40x40等预设尺寸
        this.ensurePathCapacity(total);
        this.pathVisitVersion = (this.pathVisitVersion + 1) >>> 0;
        if (this.pathVisitVersion == 0) {
            // Uint32版本号溢出时才完整清零，正常寻路无需fill
            this.pathVisited.fill(0);
            this.pathVisitVersion = 1;
        }

        let startIndex = startY * width + startX;
        let targetIndex = targetY * width + targetX;
        let head = 0;
        let tail = 0;
        this.pathQueue[tail++] = startIndex;
        this.pathVisited[startIndex] = this.pathVisitVersion;

        while (head < tail) {
            let currentIndex = this.pathQueue[head++];
            if (currentIndex == targetIndex) {
                return this.buildGridPath(width, startIndex, targetIndex);
            }

            let currentX = currentIndex % width;
            let currentY = Math.floor(currentIndex / width);
            for (let i = 0; i < this.pathDirX.length; i++) {
                let nextX = currentX + this.pathDirX[i];
                let nextY = currentY + this.pathDirY[i];
                if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) {
                    continue;
                }

                let nextIndex = nextY * width + nextX;
                if (this.pathVisited[nextIndex] == this.pathVisitVersion || !canWalk(nextX, nextY)) {
                    continue;
                }

                this.pathVisited[nextIndex] = this.pathVisitVersion;
                this.pathParent[nextIndex] = currentIndex;
                this.pathQueue[tail++] = nextIndex;
            }
        }

        return [];
    }

    /**按实际地图格子数扩充寻路缓冲区，只增不减以复用峰值容量 */
    private ensurePathCapacity(total: number) {
        if (this.pathVisited.length >= total) {
            return;
        }

        this.pathVisited = new Uint32Array(total);
        this.pathParent = new Int32Array(total);
        this.pathQueue = new Int32Array(total);
        this.pathVisitVersion = 0;
    }

    /**根据父节点索引还原路径，最后统一反转以避免unshift搬移数组 */
    private buildGridPath(width: number, startIndex: number, targetIndex: number) {
        let path: Vec2[] = [];
        let currentIndex = targetIndex;
        while (currentIndex != startIndex) {
            path.push(new Vec2(currentIndex % width, Math.floor(currentIndex / width)));
            currentIndex = this.pathParent[currentIndex];
        }
        path.reverse();
        return path;
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
