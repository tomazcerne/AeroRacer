using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;

public struct LoopData
{
    public Vector3 position; // Position of the loop
    public Quaternion rotation; // Rotation of the loop

    public LoopData(Vector3 position, Quaternion rotation)
    {
        this.position = position;
        this.rotation = rotation;
    }
}

public class LoopManager : MonoBehaviour
{
    public GameObject loopPrefab; 
    public int totalLoops = 11; 
    List<LoopData> loopDataList = new List<LoopData>
    {
        new LoopData(new Vector3(-100, 377, 1800), Quaternion.Euler(0, 100, 0)),
        new LoopData(new Vector3(-820, 297, 1060), Quaternion.Euler(0, 120, 0)),
        new LoopData(new Vector3(-1318, 240, 745), Quaternion.Euler(0, 120, 0)),
        new LoopData(new Vector3(-1855, 182, 400), Quaternion.Euler(0, 125, 0)),
        new LoopData(new Vector3(-2090, 265, 105), Quaternion.Euler(0, 100, 0)),
        new LoopData(new Vector3(-2238, 263, -935), Quaternion.Euler(0, 85, 0)),
        new LoopData(new Vector3(-1979, 228, -1557), Quaternion.Euler(0, 50, 0)),
        new LoopData(new Vector3(-780, 113, -1858), Quaternion.Euler(0, -10, 0)),
        new LoopData(new Vector3(-60, 91, -1485), Quaternion.Euler(0, -10, 0)),
        new LoopData(new Vector3(1040, 122, -565), Quaternion.Euler(0,-65, 0)),
        new LoopData(new Vector3(921, 155, 202), Quaternion.Euler(0, -160, 0))
    };
    public List<GameObject> loops; 

    public List<Image> loopFeedbackSquares;

    private void Start()
    {

        loops = new List<GameObject>(); 
        for (int i = 0; i < totalLoops; i++)
        {
            LoopData data = loopDataList[i]; 
            GameObject loop = Instantiate(loopPrefab, data.position, data.rotation);
            loops.Add(loop);
            
            LoopDetector loopDetector = loop.GetComponentInChildren<LoopDetector>();
            loopDetector.loopIndex = i; 

            LoopMissDetector loopMissDetector = loop.GetComponentInChildren<LoopMissDetector>();
            loopMissDetector.loopIndex = i; 
        }

        foreach (var square in loopFeedbackSquares)
        {
            square.color = new Color(1, 1, 1, 0.2f);
        }
    }

    public void UpdateLoopFeedback(int loopIndex, bool success)
    {
        if (loopIndex >= 0 && loopIndex < loopFeedbackSquares.Count)
        {
            loopFeedbackSquares[loopIndex].color = success ? Color.yellow : Color.red;
        }
    }
}
