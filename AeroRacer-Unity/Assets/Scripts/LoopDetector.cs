using UnityEngine;

public class LoopDetector : MonoBehaviour
{
    private LoopMissDetector missDetector;
    private bool planeEntered = false; 
    private AudioSource audioSource;
    private LoopManager loopManager;
    public int loopIndex; 

    private void Start()
    {
        missDetector = GetComponentInChildren<LoopMissDetector>();
        audioSource = GetComponent<AudioSource>();
        loopManager = FindObjectOfType<LoopManager>();
    }


    private void OnTriggerEnter(Collider other)
    {
        if (other.CompareTag("Plane")) 
        {
            planeEntered = true;
            Debug.Log($"Plane successfully flew through loop {loopIndex}");
        }
    }

    private void OnTriggerExit(Collider other)
    {
        if (other.CompareTag("Plane") && planeEntered)
        {
            print("Plane exited the loop!");
            missDetector.PlanePassedThrough(); 
            audioSource.Play();
            planeEntered = false; 
            loopManager.UpdateLoopFeedback(loopIndex, true);
        }
    }
}
