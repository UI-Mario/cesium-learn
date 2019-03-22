//添加地图
var viewer = new Cesium.Viewer('cesiumContainer', {
	shouldAnimate : true,
    shadows : true,
    timeline : false,
    animation : false,
    geocoder : false,
	baseLayerPicker: false, //是否显示图层选择控件
	sceneModePicker: false, //是否显示投影方式控件
	navigationHelpButton: false, //是否显示帮助信息控件
});
var scene=viewer.scene;  


//添加房屋模型
var modelMatrix_classroom = Cesium.Transforms.eastNorthUpToFixedFrame(  
        Cesium.Cartesian3.fromDegrees(0, 0, 0));  
var classroom = scene.primitives.add(Cesium.Model.fromGltf({  
    url : '../Apps/classroom/scene.gltf',//模型文件相对路径  
    modelMatrix : modelMatrix_classroom,
    scale : 10//调整模型在地图中的大小  
}));

// //摄像机视角
viewer.camera.flyTo({//设置视角  
    destination : Cesium.Cartesian3.fromDegrees(0, 0, 2000),
    orientation : {
        heading : 4.731089976107251,
        pitch : -0.58003481981370063
    }
});  



//机身模型的偏移参数(上下左右)
var hpRoll = new Cesium.HeadingPitchRoll();
//
var speed = 0.0;

//速度向量,后面的速度单位转换会用到
var speedVector = new Cesium.Cartesian3();
//默认按一下偏移3度
var deltaRadians = Cesium.Math.toRadians(3.0);

//飞机位置,放在经纬度为0的地方比较容易做碰撞检测
var position_kun = Cesium.Cartesian3.fromDegrees(-0.015, 0.005, 350.0);

//生成一个由两个参考系生成的矩阵
var fixedFrameTransform = Cesium.Transforms.localFrameToFixedFrameGenerator('north', 'west');

//添加模型
var kun = scene.primitives.add(Cesium.Model.fromGltf({
    //这里需要把模型路径改下(如果你用的还是HelloWord.html的话就用这个,不是的话请自行修改)
    url : '../Apps/blue_whale_-_textured/scene.gltf',
    modelMatrix : Cesium.Transforms.headingPitchRollToFixedFrame(position_kun, hpRoll, Cesium.Ellipsoid.WGS84, fixedFrameTransform),
    scale : 200
}));
//dragonball
var dragon = scene.primitives.add(Cesium.Model.fromGltf({
    url : '../Apps/shenron_-_dragon_ball/scene.gltf',
    show : false,
    modelMatrix : modelMatrix_classroom,
    scale : 20000
}))
//动画播放
kun.readyPromise.then(function(model) {
    // 控制速度动画
    model.activeAnimations.addAll({
        speedup : 0.7,
        loop : Cesium.ModelAnimationLoop.REPEAT
    });
});

dragon.readyPromise.then(function(model) {
    // 以半速循环动画
    model.activeAnimations.addAll({
        speedup : 3,
        loop : Cesium.ModelAnimationLoop.REPEAT
    });
});
//键盘监听
document.addEventListener('keydown', function(e) {
    switch (e.keyCode) {
        case 40:
            if (e.shiftKey) {
                // 按住shift加下箭头减速
                speed = Math.max(--speed, -30);
            } else {
                // 直接按下箭头降低角度
                hpRoll.pitch -= deltaRadians;
                if (hpRoll.pitch < -Cesium.Math.TWO_PI) {
                    hpRoll.pitch += Cesium.Math.TWO_PI;
                }
            }
            break;
        case 38:
            if (e.shiftKey) {
                // 按住shift加上箭头加速
                speed = Math.min(++speed, 50);
            } else {
                // 直接按上箭头抬高角度
                hpRoll.pitch += deltaRadians;
                if (hpRoll.pitch > Cesium.Math.TWO_PI) {
                    hpRoll.pitch -= Cesium.Math.TWO_PI;
                }
            }
            break;
        case 39:
            if (e.shiftKey) {
                // 飞机本身向右旋转
                hpRoll.roll += deltaRadians;
                if (hpRoll.roll > Cesium.Math.TWO_PI) {
                    hpRoll.roll -= Cesium.Math.TWO_PI;
                }
            } else {
                // 向右飞行
                hpRoll.heading += deltaRadians;
                if (hpRoll.heading > Cesium.Math.TWO_PI) {
                    hpRoll.heading -= Cesium.Math.TWO_PI;
                }
            }
            break;
        case 37:
            if (e.shiftKey) {
                // 飞机本身向左旋转
                hpRoll.roll -= deltaRadians;
                if (hpRoll.roll < 0.0) {
                    hpRoll.roll += Cesium.Math.TWO_PI;
                }
            } else {
                // 向左飞行
                hpRoll.heading -= deltaRadians;
                if (hpRoll.heading < 0.0) {
                    hpRoll.heading += Cesium.Math.TWO_PI;
                }
            }
            break;
        default:
    }
});

var speedSpan = document.getElementById('speed');
var positionSpan = document.getElementById('position');
var distanceSpan = document.getElementById('distance');

//(这里也是个1ms一次的回调)
viewer.scene.preRender.addEventListener(function(scene, time) {

    //选择的笛卡尔分量Cartesian3.UNIT_X（x轴单位长度）乘以一个标量speed/10)(根据模型大小自己定)，得到速度向量speedVector
    //将速度的单位化成跟飞机的模型矩阵一致
    speedVector = Cesium.Cartesian3.multiplyByScalar(Cesium.Cartesian3.UNIT_X, speed / 10, speedVector);
    //飞机的模型矩阵与速度向量speedVector相乘，得到position(更新位置)
    position_kun = Cesium.Matrix4.multiplyByPoint(kun.modelMatrix, speedVector, position_kun);
    //添加一个路径模型(就是白色的尾气)，这里没显示（show : flase）
    //pathPosition.addSample(Cesium.JulianDate.now(), position_kun);
    
    //飞机位置+旋转角度+地球+坐标矩阵=飞机模型矩阵(更新飞机模型矩阵)
    Cesium.Transforms.headingPitchRollToFixedFrame(position_kun, hpRoll, Cesium.Ellipsoid.WGS84, fixedFrameTransform, kun.modelMatrix);
    
    //粒子发射器的更新
    eat.emitterModelMatrix = kun.modelMatrix;

    //显示在侧边栏
    speedSpan.innerHTML = speed.toFixed(1);
    positionSpan.innerHTML = position_kun;    
    distanceSpan.innerHTML = disVector.x;

    //跟食物位置检测
    var d = Cesium.Cartesian3.distance(position_kun, position_food);
    disVector = Cesium.Cartesian3.multiplyByScalar(Cesium.Cartesian3.UNIT_X, d, disVector);
    //生成食物
    if(disVector.x < 500 && food.show == true){
	    food.show = false;
	    eat.show = true;
	    kun.scale += 100;

	    var x = Cesium.Math.randomBetween(xMin, xMax);
        var y = Cesium.Math.randomBetween(yMin, yMax);
        var z = Cesium.Math.randomBetween(zMin, zMax);

	    position_food = Cesium.Cartesian3.fromElements(x, y, z);
	    food.modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(position_food, hpRoll_food, Cesium.Ellipsoid.WGS84, fixedFrameTransform);
	    food.show = true;
	    setTimeout("setlifetime()" , 20000);
        ++count;
        if(count == 2){
            dragon.show = true;
        }
    }

    if(ifResetCamera == true){
    	resetCameraFunction();
    }
/*
鲲的碰撞盒:(吃一次食物长100，初始200)
position_kun.x +- 180*(1+1/2*count)
position_kun.y +- 180*(1+1/2*count)
position_kun.z +- 500*(1+1/2*count)
考虑三维旋转下的碰撞：
hpRoll.pitch
hpRoll.heading
*/
    //与房屋碰撞检测
    if(position_kun.x - 180*(1+1/2*count)>= 6378000 && position_kun.x + 180*(1+1/2*count)<= 6379700){
    	if(position_kun.z + 350*(1+1/2*count)*Math.cos(hpRoll.pitch)*Math.cos(hpRoll.roll)<= 350 || position_kun.z >= 4000 || position_kun.y <= -4674 || position_kun.y >= 869){
    		alert("collider detect");
            kun.destroy();
            //console.log('Collider Detect');
    	}
    }
    //触发彩蛋
    if(count == 2){
        dragon.show = true;
        speed = 0;
        count++;
        FreeCamera();
        viewer.camera.flyTo({//设置视角  
            destination : Cesium.Cartesian3.fromDegrees(7, 0, 200000),
            orientation : {
                heading : 4.731089976107251,
                pitch : -0.05003481981370063
            }
        });  
        kun.destroy();
        food.destroy();
        setTimeout("wish()" , 15000);

    }
});

//吃食物特效
function setlifetime(){
	eat.show = false;
	// alert(2);
}
function wish(){
    if(confirm("是你召唤的我吗？") == true){     //如果用户单击了确定按钮
        var name=prompt("你想要实现什么愿望？","") 
        if(name!=null){ //如果用户点击了取消按钮   
            alert("Network connection is failed...");
            dragon.destroy();
        }
    } else{
    alert("Network connection is failed...");
    dragon.destroy();
    }
}

//随机生成食物
//生成食物的范围
var xMin = 6378487;
var xMax = 6379700;
var yMin = -4674;
var yMax = 869;
var zMin = -2;
var zMax = 3800;

var xOrigin = Cesium.Math.randomBetween(xMin, xMax);
var yOrigin = Cesium.Math.randomBetween(yMin, yMax);
var zOrigin = Cesium.Math.randomBetween(zMin, zMax);        

var hpRoll_food = new Cesium.HeadingPitchRoll();

//食物位置,笛卡尔空间坐标系
var position_food = Cesium.Cartesian3.fromElements(xOrigin, yOrigin, zOrigin);

var food = scene.primitives.add(Cesium.Model.fromGltf({
    url : '../Apps/power-up_mushroom/scene.gltf',//模型文件相对路径  
    show : true,
    modelMatrix : Cesium.Transforms.headingPitchRollToFixedFrame(position_food, hpRoll_food, Cesium.Ellipsoid.WGS84, fixedFrameTransform),
    //modelMatrix : Cesium.Cartesian3.fromElements(-2849825.450015913, 4655245.7012752425, 3289280.4259582935),
    scale : 60//调整模型在地图中的大小  
}));
//距离显示要用到的单位
var disVector = new Cesium.Cartesian3();
//食物计数
var count = 0;



//视角转换
var ifResetCamera = false;
var resetCameraFunction = function() {
	ifResetCamera = true;
    scene.camera.setView({
        // 这里为了设置成视角和模型的相对位置不变，要添加模型的旋转翻滚俯仰姿态角,没写完
        destination : Cesium.Cartesian3.fromElements(position_kun.x + 180*(1+1/2*count)*Math.cos(hpRoll.pitch), position_kun.y , position_kun.z ),
        orientation : {
            heading : hpRoll.heading,
            pitch : hpRoll.pitch
        }
        //position_kun = position_kun; 
    });
};
var FreeCamera = function() {
	ifResetCamera = false;
}
if(scene.camera.position.x != position_kun.x || scene.camera.position.y != position_kun.y || scene.camera.position.z != position_kun.z){
	ifResetCamera = false;
}
//resetCameraFunction();
// button
Sandcastle.addToolbarButton('First-person perspective', resetCameraFunction);
Sandcastle.addToolbarButton('Free perspective', FreeCamera);




// snow
var snowParticleSize = scene.drawingBufferWidth / 100.0;
var snowRadius = 5000.0;
var minimumSnowImageSize = new Cesium.Cartesian2(snowParticleSize, snowParticleSize);
var maximumSnowImageSize = new Cesium.Cartesian2(snowParticleSize * 2.0, snowParticleSize * 2.0);
var snowSystem;

var snowGravityScratch = new Cesium.Cartesian3();
var snowUpdate = function(particle, dt) {
    snowGravityScratch = Cesium.Cartesian3.normalize(particle.position, snowGravityScratch);
    Cesium.Cartesian3.multiplyByScalar(snowGravityScratch, Cesium.Math.randomBetween(-30.0, -300.0), snowGravityScratch);
    particle.velocity = Cesium.Cartesian3.add(particle.velocity, snowGravityScratch, particle.velocity);

    var distance = Cesium.Cartesian3.distance(position_kun, particle.position);
    if (distance > snowRadius) {
        particle.endColor.alpha = 0.0;
    } else {
        particle.endColor.alpha = snowSystem.endColor.alpha / (distance / snowRadius + 0.1);
    }
};

snowSystem = new Cesium.ParticleSystem({
    modelMatrix : new Cesium.Matrix4.fromTranslation(position_kun),
    minimumSpeed : -1.0,
    maximumSpeed : 0.0,
    lifetime : 15.0,
    emitter : new Cesium.SphereEmitter(snowRadius),
    startScale : 0.5,
    endScale : 1.0,
    show : false,
    image : '../Apps/SampleData/snowflake_particle.png',
    emissionRate : 7000.0,
    startColor : Cesium.Color.WHITE.withAlpha(0.0),
    endColor : Cesium.Color.WHITE.withAlpha(1.0),
    minimumImageSize : minimumSnowImageSize,
    maximumImageSize : maximumSnowImageSize,
    updateCallback : snowUpdate
});
scene.primitives.add(snowSystem);

// rain
var rainParticleSize = scene.drawingBufferWidth / 80.0;
var rainRadius = 5000.0;
var rainImageSize = new Cesium.Cartesian2(rainParticleSize, rainParticleSize * 2.0);

var rainSystem;

var rainGravityScratch = new Cesium.Cartesian3();
var rainUpdate = function(particle, dt) {
    rainGravityScratch = Cesium.Cartesian3.normalize(particle.position, rainGravityScratch);
    rainGravityScratch = Cesium.Cartesian3.multiplyByScalar(rainGravityScratch, -1050.0, rainGravityScratch);

    particle.position = Cesium.Cartesian3.add(particle.position, rainGravityScratch, particle.position);

    var distance = Cesium.Cartesian3.distance(position_kun, particle.position);
    if (distance > rainRadius) {
        particle.endColor.alpha = 0.0;
    } else {
        particle.endColor.alpha = rainSystem.endColor.alpha / (distance / rainRadius + 0.1);
    }
};

rainSystem = new Cesium.ParticleSystem({
    modelMatrix : new Cesium.Matrix4.fromTranslation(position_kun),
    speed : -1.0,
    lifetime : 15.0,
    emitter : new Cesium.SphereEmitter(rainRadius),
    startScale : 1.0,
    endScale : 0.0,
    show : false,
    image : '../Apps/SampleData/circular_particle.png',
    emissionRate : 9000.0,
    startColor :new Cesium.Color(0.27, 0.5, 0.70, 0.0),
    endColor : new Cesium.Color(0.27, 0.5, 0.70, 0.98),
    imageSize : rainImageSize,
    updateCallback : rainUpdate
});
scene.primitives.add(rainSystem);


// drop down
var options = [{
	text : 'None',
	onselect :function() {
		rainSystem.show = false;
		snowSystem.show = false;

	}
}, {
    text : 'Snow',
    onselect : function() {
        rainSystem.show = false;
        snowSystem.show = true;

        scene.skyAtmosphere.hueShift = -0.8;
        scene.skyAtmosphere.saturationShift = -0.7;
        scene.skyAtmosphere.brightnessShift = -0.33;

        scene.fog.density = 0.001;
        scene.fog.minimumBrightness = 0.8;
    }
}, {
    text : 'Rain',
    onselect : function() {
        rainSystem.show = true;
        snowSystem.show = false;

        scene.skyAtmosphere.hueShift = -0.97;
        scene.skyAtmosphere.saturationShift = 0.25;
        scene.skyAtmosphere.brightnessShift = -0.4;

        scene.fog.density = 0.00025;
        scene.fog.minimumBrightness = 0.01;
    }
}];
Sandcastle.addToolbarMenu(options);

//粒子系统碰撞效果
var eat = viewer.scene.primitives.add(new Cesium.ParticleSystem({
	show : false,
	loop : true,
	image : '../Apps/SampleData/fire.png',
	width : 20,
	height : 20,
	startScale : 1.0,
	endScale : 100.0,

	life : 1.0,
	speed : 5.0,

	emitter : new Cesium.CircleEmitter(0.5),
	rate : 1.0,
	emitterModelMatrix : kun.modelMatrix,

	//modelMatrix : ,
	lifetime : 16.0,
}));





