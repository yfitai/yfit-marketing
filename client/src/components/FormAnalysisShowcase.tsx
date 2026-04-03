import { useEffect, useRef, useState, useCallback } from "react";

type Joints = Record<string, number[]>;
type FrameData = { joints: Joints; feedback: { text: string; color: string; score: number; type: string } };
type ExerciseDef = { name: string; frames: FrameData[]; repSummaries: { type: string; message: string }[] };
type FeedbackEntry = { type: string; message: string; time: string };

const BONES = [
  ["head","neck"],["neck","leftShoulder"],["neck","rightShoulder"],
  ["leftShoulder","leftElbow"],["rightShoulder","rightElbow"],
  ["leftElbow","leftWrist"],["rightElbow","rightWrist"],
  ["leftShoulder","leftHip"],["rightShoulder","rightHip"],
  ["leftHip","rightHip"],["leftHip","leftKnee"],["rightHip","rightKnee"],
  ["leftKnee","leftAnkle"],["rightKnee","rightAnkle"],
];

const EXERCISES: ExerciseDef[] = [
  { name:"Squat", frames:[
    {joints:{head:[.5,.08],neck:[.5,.16],leftShoulder:[.38,.22],rightShoulder:[.62,.22],leftElbow:[.32,.36],rightElbow:[.68,.36],leftWrist:[.30,.50],rightWrist:[.70,.50],leftHip:[.42,.50],rightHip:[.58,.50],leftKnee:[.42,.70],rightKnee:[.58,.70],leftAnkle:[.42,.90],rightAnkle:[.58,.90]},feedback:{text:"Good starting position",color:"#22c55e",score:98,type:"success"}},
    {joints:{head:[.5,.12],neck:[.5,.20],leftShoulder:[.37,.26],rightShoulder:[.63,.26],leftElbow:[.28,.38],rightElbow:[.72,.38],leftWrist:[.26,.50],rightWrist:[.74,.50],leftHip:[.41,.53],rightHip:[.59,.53],leftKnee:[.40,.72],rightKnee:[.60,.72],leftAnkle:[.41,.90],rightAnkle:[.59,.90]},feedback:{text:"Keep chest up",color:"#f59e0b",score:85,type:"warning"}},
    {joints:{head:[.5,.20],neck:[.5,.28],leftShoulder:[.36,.34],rightShoulder:[.64,.34],leftElbow:[.26,.44],rightElbow:[.74,.44],leftWrist:[.24,.54],rightWrist:[.76,.54],leftHip:[.40,.58],rightHip:[.60,.58],leftKnee:[.36,.74],rightKnee:[.64,.74],leftAnkle:[.40,.90],rightAnkle:[.60,.90]},feedback:{text:"Knees tracking over toes \u2713",color:"#22c55e",score:92,type:"success"}},
    {joints:{head:[.5,.28],neck:[.5,.36],leftShoulder:[.35,.42],rightShoulder:[.65,.42],leftElbow:[.24,.50],rightElbow:[.76,.50],leftWrist:[.22,.58],rightWrist:[.78,.58],leftHip:[.39,.62],rightHip:[.61,.62],leftKnee:[.33,.76],rightKnee:[.67,.76],leftAnkle:[.39,.90],rightAnkle:[.61,.90]},feedback:{text:"Go deeper \u2014 thighs parallel to ground",color:"#f59e0b",score:78,type:"warning"}},
    {joints:{head:[.5,.20],neck:[.5,.28],leftShoulder:[.36,.34],rightShoulder:[.64,.34],leftElbow:[.26,.44],rightElbow:[.74,.44],leftWrist:[.24,.54],rightWrist:[.76,.54],leftHip:[.40,.58],rightHip:[.60,.58],leftKnee:[.36,.74],rightKnee:[.64,.74],leftAnkle:[.40,.90],rightAnkle:[.60,.90]},feedback:{text:"Drive through heels \u2713",color:"#22c55e",score:94,type:"success"}},
    {joints:{head:[.5,.08],neck:[.5,.16],leftShoulder:[.38,.22],rightShoulder:[.62,.22],leftElbow:[.32,.36],rightElbow:[.68,.36],leftWrist:[.30,.50],rightWrist:[.70,.50],leftHip:[.42,.50],rightHip:[.58,.50],leftKnee:[.42,.70],rightKnee:[.58,.70],leftAnkle:[.42,.90],rightAnkle:[.58,.90]},feedback:{text:"Good squat!",color:"#22c55e",score:96,type:"success"}},
  ], repSummaries:[
    {type:"warning",message:"Rep 1 \u2014 Go deeper: aim for thighs parallel to ground"},
    {type:"success",message:"Rep 2 \u2014 Good squat! Keep chest up on descent"},
    {type:"success",message:"Rep 3 \u2014 Good depth! Knees tracking well"},
    {type:"warning",message:"Rep 4 \u2014 Knees too far forward \u2014 push hips back"},
    {type:"success",message:"Rep 5 \u2014 Good squat!"},
  ]},
  { name:"Push-Up", frames:[
    {joints:{head:[.5,.12],neck:[.5,.18],leftShoulder:[.35,.22],rightShoulder:[.65,.22],leftElbow:[.28,.36],rightElbow:[.72,.36],leftWrist:[.22,.50],rightWrist:[.78,.50],leftHip:[.44,.38],rightHip:[.56,.38],leftKnee:[.44,.62],rightKnee:[.56,.62],leftAnkle:[.44,.82],rightAnkle:[.56,.82]},feedback:{text:"Good plank position",color:"#22c55e",score:96,type:"success"}},
    {joints:{head:[.5,.28],neck:[.5,.34],leftShoulder:[.34,.38],rightShoulder:[.66,.38],leftElbow:[.26,.48],rightElbow:[.74,.48],leftWrist:[.22,.54],rightWrist:[.78,.54],leftHip:[.44,.50],rightHip:[.56,.50],leftKnee:[.44,.66],rightKnee:[.56,.66],leftAnkle:[.44,.82],rightAnkle:[.56,.82]},feedback:{text:"Elbows at 45\u00b0 \u2014 good form \u2713",color:"#22c55e",score:94,type:"success"}},
    {joints:{head:[.5,.34],neck:[.5,.40],leftShoulder:[.34,.44],rightShoulder:[.66,.44],leftElbow:[.26,.52],rightElbow:[.74,.52],leftWrist:[.22,.56],rightWrist:[.78,.56],leftHip:[.44,.54],rightHip:[.56,.54],leftKnee:[.44,.68],rightKnee:[.56,.68],leftAnkle:[.44,.82],rightAnkle:[.56,.82]},feedback:{text:"Chest nearly touching ground \u2713",color:"#22c55e",score:97,type:"success"}},
    {joints:{head:[.5,.18],neck:[.5,.24],leftShoulder:[.35,.28],rightShoulder:[.65,.28],leftElbow:[.28,.40],rightElbow:[.72,.40],leftWrist:[.22,.52],rightWrist:[.78,.52],leftHip:[.44,.42],rightHip:[.56,.42],leftKnee:[.44,.64],rightKnee:[.56,.64],leftAnkle:[.44,.82],rightAnkle:[.56,.82]},feedback:{text:"Push through palms \u2713",color:"#22c55e",score:93,type:"success"}},
    {joints:{head:[.5,.12],neck:[.5,.18],leftShoulder:[.35,.22],rightShoulder:[.65,.22],leftElbow:[.28,.36],rightElbow:[.72,.36],leftWrist:[.22,.50],rightWrist:[.78,.50],leftHip:[.44,.38],rightHip:[.56,.38],leftKnee:[.44,.62],rightKnee:[.56,.62],leftAnkle:[.44,.82],rightAnkle:[.56,.82]},feedback:{text:"Great push-up!",color:"#22c55e",score:95,type:"success"}},
  ], repSummaries:[
    {type:"success",message:"Rep 1 \u2014 Great form! Elbows at correct angle"},
    {type:"warning",message:"Rep 2 \u2014 Hips sagging \u2014 engage your core"},
    {type:"success",message:"Rep 3 \u2014 Full range of motion \u2713"},
    {type:"warning",message:"Rep 4 \u2014 Flare your elbows less \u2014 protect shoulders"},
    {type:"success",message:"Rep 5 \u2014 Great push-up!"},
  ]},
  { name:"Plank", frames:[
    {joints:{head:[.5,.12],neck:[.5,.18],leftShoulder:[.35,.22],rightShoulder:[.65,.22],leftElbow:[.28,.34],rightElbow:[.72,.34],leftWrist:[.22,.46],rightWrist:[.78,.46],leftHip:[.44,.36],rightHip:[.56,.36],leftKnee:[.44,.58],rightKnee:[.56,.58],leftAnkle:[.44,.80],rightAnkle:[.56,.80]},feedback:{text:"Straight line head to heels \u2713",color:"#22c55e",score:97,type:"success"}},
    {joints:{head:[.5,.14],neck:[.5,.20],leftShoulder:[.35,.24],rightShoulder:[.65,.24],leftElbow:[.28,.36],rightElbow:[.72,.36],leftWrist:[.22,.48],rightWrist:[.78,.48],leftHip:[.44,.40],rightHip:[.56,.40],leftKnee:[.44,.60],rightKnee:[.56,.60],leftAnkle:[.44,.80],rightAnkle:[.56,.80]},feedback:{text:"Hips rising slightly \u2014 lower them",color:"#f59e0b",score:82,type:"warning"}},
    {joints:{head:[.5,.16],neck:[.5,.22],leftShoulder:[.35,.26],rightShoulder:[.65,.26],leftElbow:[.28,.38],rightElbow:[.72,.38],leftWrist:[.22,.50],rightWrist:[.78,.50],leftHip:[.44,.44],rightHip:[.56,.44],leftKnee:[.44,.62],rightKnee:[.56,.62],leftAnkle:[.44,.80],rightAnkle:[.56,.80]},feedback:{text:"Hips dropping \u2014 re-engage glutes",color:"#f59e0b",score:79,type:"warning"}},
    {joints:{head:[.5,.12],neck:[.5,.18],leftShoulder:[.35,.22],rightShoulder:[.65,.22],leftElbow:[.28,.34],rightElbow:[.72,.34],leftWrist:[.22,.46],rightWrist:[.78,.46],leftHip:[.44,.36],rightHip:[.56,.36],leftKnee:[.44,.58],rightKnee:[.56,.58],leftAnkle:[.44,.80],rightAnkle:[.56,.80]},feedback:{text:"Solid hold \u2014 30 s \u2713",color:"#22c55e",score:96,type:"success"}},
  ], repSummaries:[
    {type:"success",message:"Hold 1 \u2014 Perfect alignment for 30 s"},
    {type:"warning",message:"Hold 2 \u2014 Hips rose at 15 s \u2014 keep them neutral"},
    {type:"success",message:"Hold 3 \u2014 Great core engagement throughout"},
  ]},
  { name:"Sit-Up", frames:[
    {joints:{head:[.5,.72],neck:[.5,.65],leftShoulder:[.38,.58],rightShoulder:[.62,.58],leftElbow:[.30,.52],rightElbow:[.70,.52],leftWrist:[.28,.44],rightWrist:[.72,.44],leftHip:[.42,.78],rightHip:[.58,.78],leftKnee:[.38,.88],rightKnee:[.62,.88],leftAnkle:[.38,.96],rightAnkle:[.62,.96]},feedback:{text:"Lying flat \u2014 good start",color:"#22c55e",score:96,type:"success"}},
    {joints:{head:[.5,.55],neck:[.5,.50],leftShoulder:[.38,.46],rightShoulder:[.62,.46],leftElbow:[.30,.42],rightElbow:[.70,.42],leftWrist:[.28,.38],rightWrist:[.72,.38],leftHip:[.42,.74],rightHip:[.58,.74],leftKnee:[.38,.88],rightKnee:[.62,.88],leftAnkle:[.38,.96],rightAnkle:[.62,.96]},feedback:{text:"Lead with chest, not neck",color:"#f59e0b",score:83,type:"warning"}},
    {joints:{head:[.5,.36],neck:[.5,.42],leftShoulder:[.38,.48],rightShoulder:[.62,.48],leftElbow:[.30,.44],rightElbow:[.70,.44],leftWrist:[.28,.40],rightWrist:[.72,.40],leftHip:[.42,.72],rightHip:[.58,.72],leftKnee:[.38,.88],rightKnee:[.62,.88],leftAnkle:[.38,.96],rightAnkle:[.62,.96]},feedback:{text:"Good crunch depth \u2713",color:"#22c55e",score:92,type:"success"}},
    {joints:{head:[.5,.72],neck:[.5,.65],leftShoulder:[.38,.58],rightShoulder:[.62,.58],leftElbow:[.30,.52],rightElbow:[.70,.52],leftWrist:[.28,.44],rightWrist:[.72,.44],leftHip:[.42,.78],rightHip:[.58,.78],leftKnee:[.38,.88],rightKnee:[.62,.88],leftAnkle:[.38,.96],rightAnkle:[.62,.96]},feedback:{text:"Good sit-up!",color:"#22c55e",score:94,type:"success"}},
  ], repSummaries:[
    {type:"warning",message:"Rep 1 \u2014 Pulling on neck \u2014 hands lighter behind head"},
    {type:"success",message:"Rep 2 \u2014 Good range of motion"},
    {type:"success",message:"Rep 3 \u2014 Smooth and controlled \u2713"},
    {type:"warning",message:"Rep 4 \u2014 Momentum used \u2014 slow down"},
    {type:"success",message:"Rep 5 \u2014 Great sit-up!"},
  ]},
  { name:"Deadlift", frames:[
    {joints:{head:[.5,.08],neck:[.5,.16],leftShoulder:[.38,.22],rightShoulder:[.62,.22],leftElbow:[.36,.36],rightElbow:[.64,.36],leftWrist:[.36,.52],rightWrist:[.64,.52],leftHip:[.42,.50],rightHip:[.58,.50],leftKnee:[.42,.70],rightKnee:[.58,.70],leftAnkle:[.42,.90],rightAnkle:[.58,.90]},feedback:{text:"Standing tall \u2014 bar at hips",color:"#22c55e",score:97,type:"success"}},
    {joints:{head:[.5,.18],neck:[.5,.26],leftShoulder:[.37,.32],rightShoulder:[.63,.32],leftElbow:[.35,.44],rightElbow:[.65,.44],leftWrist:[.35,.58],rightWrist:[.65,.58],leftHip:[.41,.54],rightHip:[.59,.54],leftKnee:[.41,.72],rightKnee:[.59,.72],leftAnkle:[.41,.90],rightAnkle:[.59,.90]},feedback:{text:"Hinge at hips \u2014 keep back flat",color:"#22c55e",score:90,type:"success"}},
    {joints:{head:[.5,.32],neck:[.5,.38],leftShoulder:[.36,.44],rightShoulder:[.64,.44],leftElbow:[.34,.54],rightElbow:[.66,.54],leftWrist:[.34,.68],rightWrist:[.66,.68],leftHip:[.40,.60],rightHip:[.60,.60],leftKnee:[.40,.76],rightKnee:[.60,.76],leftAnkle:[.40,.90],rightAnkle:[.60,.90]},feedback:{text:"Back rounding \u2014 engage lats!",color:"#ef4444",score:62,type:"error"}},
    {joints:{head:[.5,.08],neck:[.5,.16],leftShoulder:[.38,.22],rightShoulder:[.62,.22],leftElbow:[.36,.36],rightElbow:[.64,.36],leftWrist:[.36,.52],rightWrist:[.64,.52],leftHip:[.42,.50],rightHip:[.58,.50],leftKnee:[.42,.70],rightKnee:[.58,.70],leftAnkle:[.42,.90],rightAnkle:[.58,.90]},feedback:{text:"Lock out at top \u2713",color:"#22c55e",score:96,type:"success"}},
  ], repSummaries:[
    {type:"error",message:"Rep 1 \u2014 Back rounded at bottom \u2014 reduce weight"},
    {type:"success",message:"Rep 2 \u2014 Good hinge pattern \u2713"},
    {type:"warning",message:"Rep 3 \u2014 Bar drifting from body \u2014 keep it close"},
    {type:"success",message:"Rep 4 \u2014 Great deadlift!"},
  ]},
  { name:"Bench Press", frames:[
    {joints:{head:[.5,.14],neck:[.5,.20],leftShoulder:[.34,.24],rightShoulder:[.66,.24],leftElbow:[.26,.36],rightElbow:[.74,.36],leftWrist:[.22,.48],rightWrist:[.78,.48],leftHip:[.44,.40],rightHip:[.56,.40],leftKnee:[.44,.60],rightKnee:[.56,.60],leftAnkle:[.44,.80],rightAnkle:[.56,.80]},feedback:{text:"Bar above chest \u2014 ready",color:"#22c55e",score:96,type:"success"}},
    {joints:{head:[.5,.14],neck:[.5,.20],leftShoulder:[.34,.24],rightShoulder:[.66,.24],leftElbow:[.26,.42],rightElbow:[.74,.42],leftWrist:[.22,.54],rightWrist:[.78,.54],leftHip:[.44,.40],rightHip:[.56,.40],leftKnee:[.44,.60],rightKnee:[.56,.60],leftAnkle:[.44,.80],rightAnkle:[.56,.80]},feedback:{text:"Touch chest \u2014 full ROM \u2713",color:"#22c55e",score:95,type:"success"}},
    {joints:{head:[.5,.14],neck:[.5,.20],leftShoulder:[.34,.24],rightShoulder:[.66,.24],leftElbow:[.26,.36],rightElbow:[.74,.36],leftWrist:[.22,.48],rightWrist:[.78,.48],leftHip:[.44,.40],rightHip:[.56,.40],leftKnee:[.44,.60],rightKnee:[.56,.60],leftAnkle:[.44,.80],rightAnkle:[.56,.80]},feedback:{text:"Lock out \u2014 great rep!",color:"#22c55e",score:97,type:"success"}},
  ], repSummaries:[
    {type:"success",message:"Rep 1 \u2014 Full ROM, good control \u2713"},
    {type:"warning",message:"Rep 2 \u2014 Bounced off chest \u2014 control the touch"},
    {type:"success",message:"Rep 3 \u2014 Clean press \u2713"},
    {type:"warning",message:"Rep 4 \u2014 Wrists bending back \u2014 grip tighter"},
    {type:"success",message:"Rep 5 \u2014 Solid bench press!"},
  ]},
  { name:"Lateral Raise", frames:[
    {joints:{head:[.5,.08],neck:[.5,.16],leftShoulder:[.38,.22],rightShoulder:[.62,.22],leftElbow:[.36,.36],rightElbow:[.64,.36],leftWrist:[.34,.50],rightWrist:[.66,.50],leftHip:[.42,.52],rightHip:[.58,.52],leftKnee:[.42,.72],rightKnee:[.58,.72],leftAnkle:[.42,.90],rightAnkle:[.58,.90]},feedback:{text:"Arms at sides \u2014 ready",color:"#22c55e",score:96,type:"success"}},
    {joints:{head:[.5,.08],neck:[.5,.16],leftShoulder:[.38,.22],rightShoulder:[.62,.22],leftElbow:[.22,.24],rightElbow:[.78,.24],leftWrist:[.12,.30],rightWrist:[.88,.30],leftHip:[.42,.52],rightHip:[.58,.52],leftKnee:[.42,.72],rightKnee:[.58,.72],leftAnkle:[.42,.90],rightAnkle:[.58,.90]},feedback:{text:"Elbows slightly above wrists \u2713",color:"#22c55e",score:94,type:"success"}},
    {joints:{head:[.5,.08],neck:[.5,.16],leftShoulder:[.38,.22],rightShoulder:[.62,.22],leftElbow:[.36,.36],rightElbow:[.64,.36],leftWrist:[.34,.50],rightWrist:[.66,.50],leftHip:[.42,.52],rightHip:[.58,.52],leftKnee:[.42,.72],rightKnee:[.58,.72],leftAnkle:[.42,.90],rightAnkle:[.58,.90]},feedback:{text:"Good lateral raise!",color:"#22c55e",score:93,type:"success"}},
  ], repSummaries:[
    {type:"success",message:"Rep 1 \u2014 Good height and control \u2713"},
    {type:"warning",message:"Rep 2 \u2014 Using momentum \u2014 slow down"},
    {type:"success",message:"Rep 3 \u2014 Elbows leading nicely \u2713"},
    {type:"warning",message:"Rep 4 \u2014 Raised too high \u2014 stop at shoulder level"},
    {type:"success",message:"Rep 5 \u2014 Clean lateral raise!"},
  ]},
  { name:"Preacher Curl", frames:[
    {joints:{head:[.5,.08],neck:[.5,.16],leftShoulder:[.38,.22],rightShoulder:[.62,.22],leftElbow:[.36,.38],rightElbow:[.64,.38],leftWrist:[.34,.56],rightWrist:[.66,.56],leftHip:[.42,.52],rightHip:[.58,.52],leftKnee:[.42,.72],rightKnee:[.58,.72],leftAnkle:[.42,.90],rightAnkle:[.58,.90]},feedback:{text:"Arms extended \u2014 full stretch",color:"#22c55e",score:95,type:"success"}},
    {joints:{head:[.5,.08],neck:[.5,.16],leftShoulder:[.38,.22],rightShoulder:[.62,.22],leftElbow:[.36,.38],rightElbow:[.64,.38],leftWrist:[.34,.30],rightWrist:[.66,.30],leftHip:[.42,.52],rightHip:[.58,.52],leftKnee:[.42,.72],rightKnee:[.58,.72],leftAnkle:[.42,.90],rightAnkle:[.58,.90]},feedback:{text:"Peak contraction \u2014 squeeze \u2713",color:"#22c55e",score:97,type:"success"}},
    {joints:{head:[.5,.08],neck:[.5,.16],leftShoulder:[.38,.22],rightShoulder:[.62,.22],leftElbow:[.36,.38],rightElbow:[.64,.38],leftWrist:[.34,.56],rightWrist:[.66,.56],leftHip:[.42,.52],rightHip:[.58,.52],leftKnee:[.42,.72],rightKnee:[.58,.72],leftAnkle:[.42,.90],rightAnkle:[.58,.90]},feedback:{text:"Great preacher curl!",color:"#22c55e",score:94,type:"success"}},
  ], repSummaries:[
    {type:"success",message:"Rep 1 \u2014 Full range of motion \u2713"},
    {type:"warning",message:"Rep 2 \u2014 Dropping too fast \u2014 control descent"},
    {type:"success",message:"Rep 3 \u2014 Good squeeze at top \u2713"},
    {type:"warning",message:"Rep 4 \u2014 Elbow lifting off pad \u2014 keep it down"},
    {type:"success",message:"Rep 5 \u2014 Clean rep!"},
  ]},
  { name:"Bicep Curl", frames:[
    {joints:{head:[.5,.08],neck:[.5,.16],leftShoulder:[.38,.22],rightShoulder:[.62,.22],leftElbow:[.36,.38],rightElbow:[.64,.38],leftWrist:[.34,.56],rightWrist:[.66,.56],leftHip:[.42,.52],rightHip:[.58,.52],leftKnee:[.42,.72],rightKnee:[.58,.72],leftAnkle:[.42,.90],rightAnkle:[.58,.90]},feedback:{text:"Arms at sides \u2014 ready",color:"#22c55e",score:96,type:"success"}},
    {joints:{head:[.5,.08],neck:[.5,.16],leftShoulder:[.38,.22],rightShoulder:[.62,.22],leftElbow:[.36,.38],rightElbow:[.64,.38],leftWrist:[.34,.28],rightWrist:[.66,.28],leftHip:[.42,.52],rightHip:[.58,.52],leftKnee:[.42,.72],rightKnee:[.58,.72],leftAnkle:[.42,.90],rightAnkle:[.58,.90]},feedback:{text:"Full curl \u2014 squeeze bicep \u2713",color:"#22c55e",score:97,type:"success"}},
    {joints:{head:[.5,.08],neck:[.5,.16],leftShoulder:[.38,.22],rightShoulder:[.62,.22],leftElbow:[.36,.38],rightElbow:[.64,.38],leftWrist:[.34,.56],rightWrist:[.66,.56],leftHip:[.42,.52],rightHip:[.58,.52],leftKnee:[.42,.72],rightKnee:[.58,.72],leftAnkle:[.42,.90],rightAnkle:[.58,.90]},feedback:{text:"Good bicep curl!",color:"#22c55e",score:95,type:"success"}},
  ], repSummaries:[
    {type:"success",message:"Rep 1 \u2014 Elbows stable, great form \u2713"},
    {type:"warning",message:"Rep 2 \u2014 Swinging torso \u2014 use less weight"},
    {type:"success",message:"Rep 3 \u2014 Clean curl \u2713"},
    {type:"success",message:"Rep 4 \u2014 Good squeeze at top \u2713"},
    {type:"warning",message:"Rep 5 \u2014 Dropped too fast \u2014 slow the negative"},
  ]},
  { name:"Bent-Over Row", frames:[
    {joints:{head:[.5,.22],neck:[.5,.28],leftShoulder:[.36,.34],rightShoulder:[.64,.34],leftElbow:[.32,.46],rightElbow:[.68,.46],leftWrist:[.30,.60],rightWrist:[.70,.60],leftHip:[.40,.54],rightHip:[.60,.54],leftKnee:[.42,.72],rightKnee:[.58,.72],leftAnkle:[.42,.90],rightAnkle:[.58,.90]},feedback:{text:"Hinge position \u2014 back flat \u2713",color:"#22c55e",score:94,type:"success"}},
    {joints:{head:[.5,.22],neck:[.5,.28],leftShoulder:[.36,.34],rightShoulder:[.64,.34],leftElbow:[.32,.38],rightElbow:[.68,.38],leftWrist:[.30,.46],rightWrist:[.70,.46],leftHip:[.40,.54],rightHip:[.60,.54],leftKnee:[.42,.72],rightKnee:[.58,.72],leftAnkle:[.42,.90],rightAnkle:[.58,.90]},feedback:{text:"Elbows past torso \u2014 good \u2713",color:"#22c55e",score:95,type:"success"}},
    {joints:{head:[.5,.22],neck:[.5,.28],leftShoulder:[.36,.34],rightShoulder:[.64,.34],leftElbow:[.32,.46],rightElbow:[.68,.46],leftWrist:[.30,.60],rightWrist:[.70,.60],leftHip:[.40,.54],rightHip:[.60,.54],leftKnee:[.42,.72],rightKnee:[.58,.72],leftAnkle:[.42,.90],rightAnkle:[.58,.90]},feedback:{text:"Great bent-over row!",color:"#22c55e",score:96,type:"success"}},
  ], repSummaries:[
    {type:"success",message:"Rep 1 \u2014 Good hinge, elbows tracking \u2713"},
    {type:"warning",message:"Rep 2 \u2014 Back rounding \u2014 lighter weight or reset"},
    {type:"success",message:"Rep 3 \u2014 Solid pull \u2713"},
    {type:"success",message:"Rep 4 \u2014 Good lat engagement \u2713"},
    {type:"warning",message:"Rep 5 \u2014 Jerking the weight \u2014 control the pull"},
  ]},
];

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function lerpJoints(from: Joints, to: Joints, t: number): Joints {
  const result: Joints = {};
  for (const key of Object.keys(from)) result[key] = [lerp(from[key][0],to[key][0],t),lerp(from[key][1],to[key][1],t)];
  return result;
}

export default function FormAnalysisShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const isPlayingRef = useRef(true);
  const timeRef = useRef(0);
  const lastTimeRef = useRef(0);
  const repCountRef = useRef(0);
  const sessionSecondsRef = useRef(0);
  const exerciseIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [currentFeedback, setCurrentFeedback] = useState(EXERCISES[0].frames[0].feedback);
  const [repCount, setRepCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeExercise, setActiveExercise] = useState(0);
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackEntry[]>([
    { type:"success", message:"Session started \u2014 Squat selected", time:"0:00" },
  ]);

  const drawFrame = useCallback((canvas: HTMLCanvasElement, joints: Joints, feedback: FrameData["feedback"]) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width; const H = canvas.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = "#0f172a"; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle = "rgba(34,197,94,0.07)"; ctx.lineWidth = 1;
    for (let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for (let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    ctx.strokeStyle = "rgba(34,197,94,0.3)"; ctx.lineWidth = 2;
    ctx.beginPath();ctx.moveTo(W*.1,H*.93);ctx.lineTo(W*.9,H*.93);ctx.stroke();
    const score = feedback.score;
    const sc = score>=90?"#22c55e":score>=75?"#f59e0b":"#ef4444";
    ctx.strokeStyle="rgba(255,255,255,0.1)";ctx.lineWidth=8;
    ctx.beginPath();ctx.arc(W*.85,H*.14,26,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle=sc;ctx.lineWidth=8;
    ctx.beginPath();ctx.arc(W*.85,H*.14,26,-Math.PI/2,-Math.PI/2+(Math.PI*2*score)/100);ctx.stroke();
    ctx.fillStyle="white";ctx.font="bold 13px system-ui,sans-serif";ctx.textAlign="center";
    ctx.fillText(`${score}`,W*.85,H*.14+5);
    ctx.shadowColor="#22c55e";ctx.shadowBlur=10;ctx.strokeStyle="#4ade80";ctx.lineWidth=3;ctx.lineCap="round";
    for (const [a,b] of BONES){
      const jA=joints[a];const jB=joints[b];if(!jA||!jB)continue;
      ctx.beginPath();ctx.moveTo(jA[0]*W,jA[1]*H);ctx.lineTo(jB[0]*W,jB[1]*H);ctx.stroke();
    }
    ctx.shadowBlur=0;
    for (const [key,pos] of Object.entries(joints)){
      const x=pos[0]*W;const y=pos[1]*H;
      const r=(key.includes("Knee")||key.includes("Hip")||key==="head")?7:5;
      ctx.shadowColor="#ef4444";ctx.shadowBlur=12;ctx.fillStyle="#ef4444";
      ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;ctx.fillStyle="rgba(255,255,255,0.9)";
      ctx.beginPath();ctx.arc(x,y,r*.38,0,Math.PI*2);ctx.fill();
    }
    const pc=feedback.color;const pw=Math.min(W*.82,240);const ph=28;
    const px=(W-pw)/2;const py=H*.03;
    ctx.fillStyle=pc+"25";ctx.strokeStyle=pc+"99";ctx.lineWidth=1.5;
    ctx.beginPath();(ctx as CanvasRenderingContext2D).roundRect(px,py,pw,ph,14);ctx.fill();ctx.stroke();
    ctx.fillStyle=pc;ctx.font="bold 11px system-ui,sans-serif";ctx.textAlign="center";
    ctx.fillText(feedback.text,W/2,py+19);
  }, []);

  const startLoop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    lastTimeRef.current = performance.now();
    const loop = (now: number) => {
      if (!isPlayingRef.current) return;
      const canvas = canvasRef.current; if (!canvas) return;
      const ex = EXERCISES[exerciseIndexRef.current];
      const FD = 600; const TD = ex.frames.length * FD;
      const delta = Math.min(now - lastTimeRef.current, 100);
      lastTimeRef.current = now;
      timeRef.current = (timeRef.current + delta) % TD;
      const raw = timeRef.current / FD;
      const fi = Math.floor(raw) % ex.frames.length;
      const ni = (fi+1) % ex.frames.length;
      const t = raw - Math.floor(raw);
      const interp = lerpJoints(ex.frames[fi].joints, ex.frames[ni].joints, t);
      drawFrame(canvas, interp, ex.frames[fi].feedback);
      setCurrentFeedback(ex.frames[fi].feedback);
      if (fi === ex.frames.length-1 && t < 0.05) {
        repCountRef.current += 1;
        const nr = repCountRef.current;
        setRepCount(nr);
        const sum = ex.repSummaries[(nr-1) % ex.repSummaries.length];
        const s = sessionSecondsRef.current;
        const ts = `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;
        setFeedbackHistory(prev => [{type:sum.type,message:sum.message,time:ts},...prev].slice(0,12));
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [drawFrame]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    drawFrame(canvas, EXERCISES[0].frames[0].joints, EXERCISES[0].frames[0].feedback);
    startLoop();
    return () => cancelAnimationFrame(rafRef.current);
  }, [drawFrame, startLoop]);

  useEffect(() => {
    if (isPlaying) { timerRef.current = setInterval(()=>{sessionSecondsRef.current+=1;},1000); }
    else { if(timerRef.current) clearInterval(timerRef.current); }
    return () => { if(timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying(prev => {
      const next = !prev;
      isPlayingRef.current = next;
      if (next) { lastTimeRef.current = performance.now(); startLoop(); }
      else { cancelAnimationFrame(rafRef.current); }
      return next;
    });
  }, [startLoop]);

  const handleSelectExercise = useCallback((index: number) => {
    exerciseIndexRef.current = index;
    timeRef.current = 0; repCountRef.current = 0;
    setRepCount(0); setActiveExercise(index);
    setCurrentFeedback(EXERCISES[index].frames[0].feedback);
    const s = sessionSecondsRef.current;
    setFeedbackHistory([{type:"success",message:`${EXERCISES[index].name} selected`,time:`${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`}]);
    const canvas = canvasRef.current;
    if (canvas) drawFrame(canvas, EXERCISES[index].frames[0].joints, EXERCISES[index].frames[0].feedback);
    if (isPlayingRef.current) startLoop();
  }, [drawFrame, startLoop]);

  return (
    <section className="py-24 bg-gradient-to-br from-gray-950 via-blue-950 to-gray-900 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            AI Form Analysis \u2014 Live Demo
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Your AI spotter{" "}
            <span className="bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">never blinks.</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Real-time pose tracking catches form errors before they cause injury. Most apps count reps. YFIT coaches every single one.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div className="space-y-4">
            <div className="bg-gray-900/80 border border-green-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-green-500/10">
              <div className="flex items-center justify-between px-4 py-3 border-b border-green-500/10 bg-gray-900/50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" /><div className="w-3 h-3 rounded-full bg-yellow-500/70" /><div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <span className="text-xs text-gray-500 font-mono">YFIT AI \u2014 {EXERCISES[activeExercise].name}</span>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /><span className="text-xs text-green-400">LIVE</span></div>
              </div>
              <canvas ref={canvasRef} width={400} height={420} className="w-full block" />
              <div className="flex items-center justify-between px-6 py-4 border-t border-green-500/10 bg-gray-900/50">
                <div className="text-center"><div className="text-2xl font-bold text-white">{repCount}</div><div className="text-xs text-gray-500">Reps</div></div>
                <div className="text-center"><div className="text-2xl font-bold" style={{color:currentFeedback.color}}>{currentFeedback.score}</div><div className="text-xs text-gray-500">Form Score</div></div>
                <div className="text-center"><div className="text-2xl font-bold text-white">10</div><div className="text-xs text-gray-500">Exercises</div></div>
                <button onClick={handlePlayPause} className="px-4 py-2 rounded-lg text-xs font-semibold border transition-all"
                  style={{borderColor:"rgba(34,197,94,0.3)",color:isPlaying?"#f59e0b":"#22c55e",background:"rgba(34,197,94,0.05)"}}>
                  {isPlaying ? "\u23f8 Pause" : "\u25b6 Play"}
                </button>
              </div>
            </div>
            <div className="bg-gray-900/80 border border-green-500/20 rounded-2xl overflow-hidden shadow-xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-green-500/10">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Rep Feedback</span>
                <button onClick={()=>setFeedbackHistory([{type:"success",message:`${EXERCISES[activeExercise].name} \u2014 session started`,time:"0:00"}])} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Clear</button>
              </div>
              <div className="h-40 overflow-y-auto px-4 py-3 space-y-2">
                {feedbackHistory.map((entry,i)=>(
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-xs text-gray-600 font-mono w-8 flex-shrink-0 pt-0.5">{entry.time}</span>
                    <div className="flex-1 text-xs px-3 py-1.5 rounded-lg" style={{
                      background:entry.type==="success"?"rgba(34,197,94,0.08)":entry.type==="warning"?"rgba(245,158,11,0.08)":"rgba(239,68,68,0.08)",
                      color:entry.type==="success"?"#86efac":entry.type==="warning"?"#fcd34d":"#fca5a5",
                      border:`1px solid ${entry.type==="success"?"rgba(34,197,94,0.2)":entry.type==="warning"?"rgba(245,158,11,0.2)":"rgba(239,68,68,0.2)"}`,
                    }}>{entry.message}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-8 lg:pt-4">
            {[
              {icon:"\ud83c\udfaf",title:"10 Exercises Supported",desc:"Squat, push-up, plank, sit-up, deadlift, bench press, lateral raise, preacher curl, bicep curl, and bent-over row \u2014 all analysed in real time using your device camera.",color:"#22c55e"},
              {icon:"\u26a1",title:"Real-Time Form Corrections",desc:"Feedback fires every frame \u2014 \u2018Go deeper\u2019, \u2018Keep chest up\u2019, \u2018Knees too far forward\u2019. You correct the issue before the rep is even finished.",color:"#f59e0b"},
              {icon:"\ud83d\udccb",title:"Per-Rep Feedback History",desc:"Every rep gets a summary \u2014 the worst issue or a \u2018Good squat!\u2019 if your form was clean. Scroll back through your session to see exactly where you improved.",color:"#a78bfa"},
              {icon:"\ud83d\udee1\ufe0f",title:"Injury Prevention",desc:"Patterns that lead to injury \u2014 knee cave, forward lean, hip drop \u2014 are flagged before they become chronic problems. Your joints will thank you.",color:"#38bdf8"},
            ].map(item=>(
              <div key={item.title} className="flex gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{background:item.color+"15",border:`1px solid ${item.color}30`}}>{item.icon}</div>
                <div><h3 className="text-white font-semibold mb-1">{item.title}</h3><p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p></div>
              </div>
            ))}
            <div className="pt-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Click any exercise to preview its animation</p>
              <div className="flex flex-wrap gap-2">
                {EXERCISES.map((ex,i)=>(
                  <button key={ex.name} onClick={()=>handleSelectExercise(i)}
                    className="text-xs px-3 py-1.5 rounded-full border transition-all duration-200 cursor-pointer"
                    style={{borderColor:activeExercise===i?"#22c55e":"rgba(34,197,94,0.2)",color:activeExercise===i?"#ffffff":"#4ade80",background:activeExercise===i?"rgba(34,197,94,0.25)":"rgba(34,197,94,0.08)",fontWeight:activeExercise===i?700:400,boxShadow:activeExercise===i?"0 0 12px rgba(34,197,94,0.3)":"none"}}>
                    {activeExercise===i?"\u25b6 ":""}{ex.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-2">
              <a href="https://app.yfitai.com" className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold px-8 py-4 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-green-500/25">
                Try Form Analysis Free
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </a>
              <p className="text-xs text-gray-600 mt-3">3 free sessions/month on the Free plan</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
