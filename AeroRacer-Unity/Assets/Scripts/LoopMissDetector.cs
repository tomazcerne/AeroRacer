using UnityEngine;

public class LoopMissDetector : MonoBehaviour
{
    private bool planeInZone = false;
    private bool planePassedThrough = false;
    private LoopManager loopManager;
    public int loopIndex; 

    private void Start()
    {
        loopManager = FindObjectOfType<LoopManager>(); // Get reference to the LoopManager
    }

    private void OnTriggerEnter(Collider other)
    {
        if (other.CompareTag("Plane"))
        {
            planeInZone = true;
            planePassedThrough = false; // Reset pass-through status
        }
    }

    private void OnTriggerExit(Collider other)
    {
        if (other.CompareTag("Plane"))
        {
            if (!planePassedThrough)
            {
                Debug.Log("Plane missed the loop!");
                loopManager.UpdateLoopFeedback(loopIndex, false);
            }
            planeInZone = false;
        }
    }

    public void PlanePassedThrough()
    {
        if (planeInZone)
        {
            planePassedThrough = true; // Only mark as passed if the plane is still in the zone
        }
    }
}
