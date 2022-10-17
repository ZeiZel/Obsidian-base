
```JS
//*_Супер After Effects  
{  
   //!_Тряска  
   Wiggle(4,50); // Если будем использовать posrterizeTime(), то нужно использовать PT до виггла  
  
   //!_Изменения по времени   time*100;  
  
   //!_Bounce Expression  
   amp = 0.08; // амплитуда  
   freq = 2; // частота  
   decay = 4; // затухание  
   n = 0;   
if (numKeys > 0){  
   n = nearestKey(time).index;  
   if (key(n).time > time){  
   n--;   
   }   
   }   
if (n == 0){   
t = 0;  
   }else{   
t = time - key(n).time;   
   }   
if (n > 0){   
v = velocityAtTime(key(n).time - thisComp.frameDuration/10);   
M=Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t);   
value + v*amp*M;  
   }else{   
value;   
   }  
  
   //!_Index expression   
index*30 //например на 30 единиц изменение значения относительно прошлого  
  
   //!_связывание параметров   thisComp.layer("Small").transform.opacity; // этаКомпозиция.слой("название").трансформация.непрозрачность; // value - тут только одно значение  
   a = comp("Anything").layer("Small").transform.position[0]; // [value[0],value[1]]; - значение X и Y  
   a*10;  
  
   //!_Linear/Ease - связывание одного параметра с другим  
   posX = thisComp.layer("movingRec").transform.position[0]; // переменнная, содержащая позицию по иксу слоя movingRec  
   ease(posX,275,896,100,0);  
  
  
   posX = thisComp.layer("movingRec").transform.position[0]; // переменнная, содержащая позицию по иксу слоя movingRec  
   a = linear(posX,275,896,value[0],value[0]/2);  //? value -исходное значение параметра, которое мы задали   
                                       //? чтобы изменения былми плавные, вместо linear нужно вписать ease  
   /* переменная a с линейной зависимостью от параметра PosX, где   пока posX меняется в диапазоне от 275 до 896, изменять параметры изменяемого объекта от value[0] до половины value[0]  
   */   [a,a]; //* value[0],value[1] //тут a и a ссылаются на первое и второе значение изменяемого параметра (в данном случае opacity)   
   //!_ If/else logic - конструкция если/то   prov = thisComp.layer("Controller").effect("on-off")("Checkbox") // 1 / 0 //проверка значения чекбокса, который называется on-off  
   if(prov == 1) // если пров хранит единицу  
   {  
      wiggle(2,100); // то будет активирован wiggle  
   }  
   else // в противном случае  
   {  
      [value[0],value[1]]; // значение останется прежним  
   }  
   //!_Random - рандомные значения через экспрешшены  
   random(0,100) // генерируется число от 0 до 100  
  
   a = Math.floor(time/0.5) //? time будет выводить значение времени от 0 и до бесконечности, 0,5 отвечает за частоту генерации числа  
                     //? Math.floor() округляет в меньшую сторону всегда   SeedRandom(a,true); //? создаёт сид рандома (генерирует новые произвольные значения)  
               //? если написать после запятой true, то сидер остановит генерацию на одном рандомном значении   res = random(0,100); // хранит число от 0 до 100  
   Math.round(r); // округляет число до целого  
}  
  
  
//* Супер Моушен  
{  
   //! 1 Основные выражения AE   
LoopOut() == LoopOut("cycle"); //? Повторяет анимацию до конца композиции  
   LoopOut("pingpong"); //? зацикливает анимацию с возвращением объекта по той же траектории, что и была при его прошлом продвижении  
   LoopOut("continue"); //? продолжает анимацию с последней точки и с той же скоростью движения объекта  
   LoopOut("offset"); //? продолжает выполнение анимации, но с сохранением её шага. Будет повторять анимацию, но с учётом пройденного расстрояния  
   LoopOut("cycle",2); //? выбирает с конца количество ключей, которые будет повторять. Если написать 2, то будет повторять два последних действия, если 1, то 2 последних кейфрейма (числа могут быть любыми)  
   LoopIn(); //? продолжает анимацию до последнего ключевого кадра. Может выполнять саму анимацию до её начала, но не выполняет после  
   //? LoopOut выполняет анимацию полсе анимации ключевых кадров, а до них он ничего не воспроизводит   framesToTime(25); //? переводт кадры в секунды. В скобочках указано сколько должно быть кадров в секунде  
   LoopOutDuration("cycle", framesToTime(25)); //? выполняет анимацию, растягивая ей на определённое время, указанное в FTT  
      //! 2 Выражение затухающих колебаний  
   //? без привязки к контроллеру   amp = .06; //амплитуда  
   freq = 2; //частота  
   decay = 5; //затухание  
   n = 0;  
   if (numKeys > 0){  
   n = nearestKey(time).index;  
   if (key(n).time > time){  
   n--;  
   }   }   if (n == 0){  
   t = 0;  
   }else{  
   t = time - key(n).time;  
   }   if (n > 0){  
   v = velocityAtTime(key(n).time - thisComp.frameDuration/10);  
   value + v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t);  
   }else{  
   value;  
   }   //? Тут уже есть привязка к контроллеру  
   amp = thisComp.layer("Adjustment Layer 1").effect("Amp")("Slider");  
   freq = thisComp.layer("Adjustment Layer 1").effect("Freq")("Slider");  
   decay = thisComp.layer("Adjustment Layer 1").effect("Dec")("Slider");  
   n = 0;  
   if (numKeys > 0){  
   n = nearestKey(time).index;  
   if (key(n).time > time){  
   n--;  
   }   }   if (n == 0){  
   t = 0;  
   }else{  
   t = time - key(n).time;  
   }   if (n > 0){  
   v = velocityAtTime(key(n).time - thisComp.frameDuration/10);  
   value + v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t);  
   }else{  
   value;  
   }   //! 3 Переменные   
comp("NameOfComposition").layer("NameOfLayer").transform.position;  
   thisComp.layer("Adjustment Layer 1").effect("Color Control 4")("Color") //? тут мы подсоединили цвет со слайдером  
   thisComp.layer("Shape Layer 1").content("Rectangle 1").content("Fill 1").color //? тут мы обратились почти полностью к цвету слоя  
   [x,y];  
   [100,100];  
   a = 200  
   [100, 100+a, 100-a*2]  
   value; //? то же смамое, что и тот же, например, transform.position. Просто берёт значение исходное  
   [value[0],value[2]]; //? если в параметре два разных значения, то их массив представляется в следующем виде  
      //? С помощью кода, написанного чуть ниже, можно измерять дистанцию между объектами  
   posGreen = thisComp.layer("Shape Layer 2").transform.position; // [x,y]  
   posOrange = thisComp.layer("Shape Layer 3").transform.position; // [x,y]  
   deltaPosition = posOrange[0] - posGreen[0]; //number  
   Math.round(deltaPosition); //? Этот оператор округляет значения   
if(deltaPosition < 0){Math.round(deltaPosition*(-1));}  
   //! 4 Индекс и функции  
   index; //? данный оператор хранит в себе значение индекса слоя и если слой первый, то будет хранится значение 1  
   index*10; //? каждый последующий индекс слоя будет умножаться на 10 и данное значение будет попадать в слой  
   (index-1)*10 //? будет идти отсчёт с нуля  
   {//? Линейный параметр   
      /*  
         ? Пока параметр (ротейшн, скейл, позишн и т.д.) t меняется         ? От своего минимального(tMin) до максимального(tMax) значения  
         ? То значение функции (а значит того параметра, к которому она применена) будет принимать значения в диапазоне от первого(value1) до последнего(value2)      */      linear(t, tMin, tMax, value1, value2);  
      KOF = effect("Slider Control")("Slider") //? эта переменная хранит значение вписанное в параметре "slider" эффекта слайдера  
      posCircle = thisComp.layer("Circle").transform.position[0]; //? переменная, содержащая ось x  
      /*         ? Тут мы написали, что пока позиция круга, на который мы сослались чуть выше, меняется от 280 до 960, то значение размера второго объекта будет меняться         ? от стокового значения до значения помноженного на коэффициент вписанный в слайдер      */      linear(posCircle, 280, 960, value, value*KOF);  
   }   ease(t, tMin, tMax, value1, value2); //? работает точно так же как и linear, но сглаживает в начале и в конце анимацию   
     
     
{ //? ValueAtTime   
ValueAtTime(time); //? берёт определённое значение параметра в каждую секунду времени  
      posMain = thisComp.layer("Main_Bar").transform.position;//[x,y] //? позиция главного прямоугольника  
      delay = thisComp.layer("Delay").effect("Delay")("Slider") //? обращение к слайдеру, контролируещему коэффициент  
      oneFrame = thisComp.frameDuration; //? переводит значения в fps композиции (перевод значения в кадры)  
      newY = posMain.ValueAtTime(time-delay*oneFrame*(index-2)); //[x,y] //?   
[value[0], newY[1]];  
   }   // ! Doc-анимация макинтоша  
   { //? Код для иконок  
      iconP = transform.position; // x,y  
      iconS = transform.scale;  
      ArrowP = thisComp.layer("Arrow").transform.position; // x,y  
      scaleF = layer("Control Dock Effect").effect("Scale Factor")("Slider"); //num  
      Dis = layer("Control Dock Effect").effect("Distance")("Slider") //num   
}  
   { //? Код для определения позции стрелки на экране  
      ArrowP = thisComp.layer("Arrow").transform.position;  
      "Arrow Position:  " + Math.round(ArrowP[0]) + ' ' + Math.round(ArrowP[1]);   
   }  
   lenght(a,b); //? Оператор для определения расстояния (не бывает отрицательным)  
   { //? Определение расстояния меджду двумя слоями (иконка и стрелка)  
      delta = Math.round(length(ArrowP, iconP)); //  
      linear(delta, 0, Dis, iconS*scaleF, iconS);  
   }   { //? Полный код для иконки  
      iconP = transform.position; // x,y  
      iconS = transform.scale;  
      ArrowP = thisComp.layer("Arrow").transform.position; // x,y  
      scaleF = layer("Control Dock Effect").effect("Scale Factor")("Slider"); //num  
      Dis = layer("Control Dock Effect").effect("Distance")("Slider") //num   
        
delta = Math.round(length(ArrowP, iconP)); //  
      linear(delta, 0, Dis, iconS*scaleF, iconS);  
   }  
   //! 5 Анимация для текста  
   {  
      amp = thisComp.layer("Bounce Controller").effect("Amp")("Slider");  
      freq = thisComp.layer("Bounce Controller").effect("Freq")("Slider");  
      decay = thisComp.layer("Bounce Controller").effect("Dec")("Slider");  
      n = 0;  
      if (numKeys > 0){  
      n = nearestKey(time).index;  
      if (key(n).time > time){  
      n--;  
      }}      if (n == 0){  
      t = 0;  
      }else{  
      t = time - key(n).time;  
      }      if (n > 0){  
      v = velocityAtTime(key(n).time - thisComp.frameDuration/10);  
      value + v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t);  
      }else{  
      value;  
      }   }}  
  
```

```
//* Дополнительные скрипты  
{  
   //! Bounce epression transition - Клинок рассекающий демонов  
   n = 0;  
   if (numKeys > 0){  
   n = nearestKey(time).index;  
   if (key(n).time > time){  
   n--;  
   }   }   if (n == 0){  
   t = 0;  
   }else{  
   t = time - key(n).time;  
   }   if (n > 0){  
   v = velocityAtTime(key(n).time - thisComp.frameDuration/10);  
   amp = .1;  
   freq =3.1;  
   decay = 7;  
   value + v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t);  
   }else{  
   value;  
   }
}
```